import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserIPWithFallback } from "@/utils/ipUtils";

interface SpamCheckResult {
  allowed: boolean;
  reason?: string;
  message?: string;
  confidence?: number;
  indicators?: Record<string, any>;
  retryAfter?: number;
  blockExpiresAt?: string;
}

interface RateLimitInfo {
  remainingPostsHour?: number;
  remainingPostsDay?: number;
  remainingTopicsDay?: number;
}

export const useEnhancedSpamDetection = () => {
  const [isChecking, setIsChecking] = useState(false);

  // Generate browser fingerprint for additional tracking
  const generateFingerprint = useCallback((): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("Browser fingerprint", 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency || 0,
    ].join("|");

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(36);
  }, []);

  const checkRateLimit = useCallback(
    async (
      sessionId: string,
      contentType: "post" | "topic" = "post"
    ): Promise<SpamCheckResult & RateLimitInfo> => {
      setIsChecking(true);
      try {
        const userIP = await getUserIPWithFallback();
        const fingerprint = generateFingerprint();
        if (!userIP) {
          return {
            allowed: false,
            reason: "ip_detection_failed",
            message: "Unable to verify your connection. Please try again.",
          };
        }
        // Check if IP is banned
        const { data: ipCheck, error: ipError } = await supabase.rpc(
          "check_ip_banned_secure",
          { user_ip: userIP }
        );
        if (ipError) {
          console.error("IP ban check failed:", ipError);
        } else if (ipCheck) {
          const result = ipCheck as {
            is_banned: boolean;
            ban_type?: string;
            expires_at?: string;
            reason?: string;
          };
          if (result.is_banned) {
            const banType = result.ban_type;
            const expires = result.expires_at;
            let message = `Your IP address has been ${
              banType === "permanent" ? "permanently " : ""
            }blocked: ${result.reason}`;
            if (banType === "temporary" && expires) {
              const expiryDate = new Date(expires);
              message += ` (expires: ${expiryDate.toLocaleDateString()})`;
            }
            return {
              allowed: banType === "shadowban",
              reason: "ip_banned",
              message,
              blockExpiresAt: expires,
            };
          }
        }
        // ENFORCE RATE LIMITS
        // Import rate limit utility
        const {
          checkRateLimit,
          getUserAccountAge,
          NEW_USER_LIMITS,
          ESTABLISHED_USER_LIMITS,
        } = await import("@/utils/rateLimit");
        // Determine user/account age
        let authorId = sessionId;
        let accountAge = 0;
        if (authorId && authorId.length === 36) {
          accountAge = await getUserAccountAge(authorId);
        }
        const config =
          accountAge < 7 ? NEW_USER_LIMITS : ESTABLISHED_USER_LIMITS;
        // Check user rate limit
        const userLimit = await checkRateLimit({ userId: authorId, config });
        if (!userLimit.allowed) {
          return {
            allowed: false,
            reason: "rate_limited",
            message: userLimit.reason,
          };
        }
        // Check IP rate limit
        const ipLimit = await checkRateLimit({ ip: userIP, config });
        if (!ipLimit.allowed) {
          return {
            allowed: false,
            reason: "rate_limited",
            message: ipLimit.reason,
          };
        }
        return {
          allowed: true,
        };
      } catch (error) {
        console.error("Error checking rate limit:", error);
        return {
          allowed: true,
        };
      } finally {
        setIsChecking(false);
      }
    },
    [generateFingerprint]
  );

  const analyzeContent = useCallback(
    async (
      content: string,
      contentType: "post" | "topic" = "post"
    ): Promise<SpamCheckResult> => {
      try {
        const { data, error } = await supabase.rpc("analyze_content_for_spam", {
          content_text: content,
          content_type: contentType,
        });

        if (error) {
          console.error("Content analysis failed:", error);
          return {
            allowed: true, // Fail open - don't block if analysis fails
          };
        }

        const result = data as {
          is_spam: boolean;
          confidence: number;
          indicators: Record<string, any>;
        };

        // If high confidence spam detected, automatically report and track
        if (result.is_spam && result.confidence >= 0.8) {
          await autoReportSpam(content, contentType, result);
        }

        return {
          allowed: !result.is_spam,
          reason: result.is_spam ? "spam_detected" : undefined,
          message: result.is_spam
            ? `Content flagged as spam (${Math.round(
                result.confidence * 100
              )}% confidence). Please revise your message.`
            : undefined,
          confidence: result.confidence,
          indicators: result.indicators,
        };
      } catch (error) {
        console.error("Error analyzing content:", error);
        return { allowed: true }; // Fail open
      }
    },
    []
  );

  const autoReportSpam = useCallback(
    async (
      content: string,
      contentType: "post" | "topic",
      analysis: { confidence: number; indicators: Record<string, any> }
    ) => {
      try {
        const userIP = await getUserIPWithFallback();

        // Auto-report as spam
        await supabase.from("spam_reports").insert({
          content_type: contentType,
          content_id: "pending", // Will be updated when content is created
          reporter_id: null,
          reporter_ip: userIP,
          report_reason: `Automated detection: ${Object.keys(
            analysis.indicators
          ).join(", ")}`,
          automated_detection: true,
          confidence_score: analysis.confidence,
        });

        // Check for mass spam activity from this IP
        const { data: recentSpam } = await supabase
          .from("spam_reports")
          .select("id")
          .eq("reporter_ip", userIP)
          .eq("automated_detection", true)
          .gte(
            "created_at",
            new Date(Date.now() - 60 * 60 * 1000).toISOString()
          ); // Last hour

        if (recentSpam && recentSpam.length >= 3) {
          // Auto-ban IP for mass spam
          await supabase.from("banned_ips").insert({
            ip_address: userIP,
            ban_type: "temporary",
            reason: "Automated ban: Multiple spam attempts detected",
            admin_notes: `Auto-banned after ${recentSpam.length} spam attempts in 1 hour`,
            expires_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString(),
          });
        }
      } catch (error) {
        console.error("Error auto-reporting spam:", error);
      }
    },
    []
  );

  const recordActivity = useCallback(
    async (
      sessionId: string,
      contentType: "post" | "topic" = "post"
    ): Promise<void> => {
      try {
        const userIP = await getUserIPWithFallback();
        const fingerprint = generateFingerprint();

        if (!userIP) return;

        await supabase.rpc("record_enhanced_anonymous_activity", {
          user_ip: userIP,
          p_session_id: sessionId,
          p_fingerprint_hash: fingerprint,
          p_content_type: contentType,
        });
      } catch (error) {
        console.error("Error recording activity:", error);
        // Don't throw - this shouldn't block posting
      }
    },
    [generateFingerprint]
  );

  const reportSpam = useCallback(
    async (
      contentType: "post" | "topic",
      contentId: string,
      reason: string,
      reporterId?: string
    ): Promise<boolean> => {
      try {
        const userIP = await getUserIPWithFallback();

        const { error } = await supabase.from("spam_reports").insert({
          content_type: contentType,
          content_id: contentId,
          reporter_id: reporterId || null,
          reporter_ip: userIP,
          report_reason: reason,
          automated_detection: false,
        });

        if (error) {
          console.error("Error reporting spam:", error);
          return false;
        }

        return true;
      } catch (error) {
        console.error("Error reporting spam:", error);
        return false;
      }
    },
    []
  );

  return {
    checkRateLimit,
    analyzeContent,
    recordActivity,
    reportSpam,
    isChecking,
  };
};
