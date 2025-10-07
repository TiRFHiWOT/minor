import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateSlugFromTitle } from "@/utils/urlHelpers";
import { useAuth } from "./useAuth";
import { sessionManager } from "@/utils/sessionManager";
import { useEnhancedSpamDetection } from "./useEnhancedSpamDetection";
import { getMandatoryUserIP } from "@/utils/ipUtils";

interface CreateTopicData {
  title: string;
  content: string;
  category_id: string;
}

export const useCreateTopic = () => {
  const { analyzeContent } = useEnhancedSpamDetection();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTopicData) => {
      // Spam detection and banned word checks for title
      const spamTitleResult = await analyzeContent(data.title, "topic");
      console.log(
        "[SpamDetection] analyzeContent (title) result:",
        spamTitleResult
      );
      if (!spamTitleResult.allowed) {
        throw new Error(
          spamTitleResult.message ||
            "Your topic title was flagged as spam and cannot be posted. Please revise your message."
        );
      }
      const { data: bannedWordsTitleResult, error: bannedWordsTitleError } =
        await supabase.rpc("check_banned_words", {
          content_text: data.title,
        });
      console.log(
        "[SpamDetection] check_banned_words (title) result:",
        bannedWordsTitleResult,
        bannedWordsTitleError
      );
      if (bannedWordsTitleError) {
        console.error(
          "Banned words check (title) failed:",
          bannedWordsTitleError
        );
      } else if (bannedWordsTitleResult) {
        const result = bannedWordsTitleResult as {
          is_blocked: boolean;
          matches: Array<{ word: string }>;
        };
        if (result.is_blocked) {
          const matches = result.matches || [];
          const bannedWords = matches
            .map((match: { word: string }) => match.word)
            .join(", ");
          throw new Error(
            `Your topic title contains banned words: ${bannedWords}`
          );
        }
      }

      // Spam detection and banned word checks for content
      const spamContentResult = await analyzeContent(data.content, "topic");
      console.log(
        "[SpamDetection] analyzeContent (content) result:",
        spamContentResult
      );
      if (!spamContentResult.allowed) {
        throw new Error(
          spamContentResult.message ||
            "Your topic content was flagged as spam and cannot be posted. Please revise your message."
        );
      }
      const { data: bannedWordsContentResult, error: bannedWordsContentError } =
        await supabase.rpc("check_banned_words", {
          content_text: data.content,
        });
      console.log(
        "[SpamDetection] check_banned_words (content) result:",
        bannedWordsContentResult,
        bannedWordsContentError
      );
      if (bannedWordsContentError) {
        console.error(
          "Banned words check (content) failed:",
          bannedWordsContentError
        );
      } else if (bannedWordsContentResult) {
        const result = bannedWordsContentResult as {
          is_blocked: boolean;
          matches: Array<{ word: string }>;
        };
        if (result.is_blocked) {
          const matches = result.matches || [];
          const bannedWords = matches
            .map((match: { word: string }) => match.word)
            .join(", ");
          throw new Error(
            `Your topic content contains banned words: ${bannedWords}`
          );
        }
      }
      // Enhanced spam detection: block if spam is detected
      const spamResult = await analyzeContent(data.content, "topic");
      console.log("[SpamDetection] analyzeContent result:", spamResult);
      if (!spamResult.allowed) {
        throw new Error(
          spamResult.message ||
            "Your topic was flagged as spam and cannot be posted."
        );
      }

      // Check for banned words (backup check)
      const { data: bannedWordsResult, error: bannedWordsError } =
        await supabase.rpc("check_banned_words", {
          content_text: data.content,
        });
      console.log(
        "[SpamDetection] check_banned_words result:",
        bannedWordsResult,
        bannedWordsError
      );
      if (bannedWordsError) {
        console.error("Banned words check failed:", bannedWordsError);
        // Continue with creation if check fails to avoid blocking legitimate topics
      } else if (bannedWordsResult) {
        const result = bannedWordsResult as {
          is_blocked: boolean;
          matches: Array<{ word: string }>;
        };
        if (result.is_blocked) {
          const matches = result.matches || [];
          const bannedWords = matches
            .map((match: { word: string }) => match.word)
            .join(", ");
          throw new Error(
            `You are not allowed to create topics with: ${bannedWords}`
          );
        }
      }
      // Sanitize content via server-side processing so banned words are replaced
      try {
        type ProcessedResponse = string | { processed_text?: string } | null;
        const { data: processedContent, error: processContentError } =
          (await supabase.rpc("process_banned_words", {
            content_text: data.content,
          })) as { data: ProcessedResponse; error: unknown };
        if (processContentError) {
          console.error(
            "process_banned_words (content) failed:",
            processContentError
          );
        } else if (processedContent) {
          if (typeof processedContent === "string") {
            data.content = processedContent;
          } else if (processedContent.processed_text) {
            data.content = processedContent.processed_text;
          }
          console.log(
            "[SpamDetection] Content sanitized via process_banned_words:",
            data.content
          );
        }
      } catch (e) {
        console.error("process_banned_words (content) exception:", e);
      }

      // Also sanitize title so banned words don't show in topic list
      try {
        type ProcessedResponse2 = string | { processed_text?: string } | null;
        const { data: processedTitle, error: processTitleError } =
          (await supabase.rpc("process_banned_words", {
            content_text: data.title,
          })) as { data: ProcessedResponse2; error: unknown };
        if (processTitleError) {
          console.error(
            "process_banned_words (title) failed:",
            processTitleError
          );
        } else if (processedTitle) {
          if (typeof processedTitle === "string") {
            data.title = processedTitle;
          } else if (processedTitle.processed_text) {
            data.title = processedTitle.processed_text;
          }
          console.log(
            "[SpamDetection] Title sanitized via process_banned_words:",
            data.title
          );
        }
      } catch (e) {
        console.error("process_banned_words (title) exception:", e);
      }
      console.log("Creating topic:", data);

      // Get user's IP address for tracking - MANDATORY
      let userIP: string;
      try {
        userIP = await getMandatoryUserIP();
        console.log("DEBUG TOPIC: Got mandatory user IP:", userIP);
      } catch (ipError) {
        console.error("Failed to get IP address:", ipError);
        throw new Error(
          "Unable to determine your IP address. Please check your network connection and try again."
        );
      }

      // Get category info including moderation requirements
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("level, name, requires_moderation")
        .eq("id", data.category_id)
        .single();

      if (categoryError) {
        throw new Error("Invalid category selected");
      }

      if (category.level !== 2 && category.level !== 3) {
        throw new Error(
          `Topics can only be created in discussion or age group categories. "${category.name}" is for browsing only.`
        );
      }

      // Generate slug from title with unique suffix
      const baseSlug = generateSlugFromTitle(data.title);
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

      let isTemporaryUser = false;
      let authorId: string;

      if (user) {
        // Check if this is a temporary user
        const { data: tempUserCheck } = await supabase.rpc(
          "is_temporary_user",
          { user_id: user.id }
        );
        isTemporaryUser = tempUserCheck || false;
        authorId = user.id;
        console.log(
          "DEBUG TOPIC: Creating topic for user:",
          user.id,
          "isTemporary:",
          isTemporaryUser
        );
      } else {
        // Anonymous user - use temporary user ID
        const tempUserId = sessionManager.getTempUserId();
        console.log("DEBUG TOPIC: Got temp user ID:", tempUserId);
        if (!tempUserId) {
          throw new Error("No temporary user session available");
        }
        authorId = tempUserId;
        isTemporaryUser = true;
        console.log(
          "DEBUG TOPIC: Creating topic with temporary user ID:",
          tempUserId
        );
      }

      const topicData: {
        title: string;
        content: string;
        category_id: string;
        slug: string;
        is_pinned: boolean;
        is_locked: boolean;
        view_count: number;
        reply_count: number;
        last_reply_at: string;
        moderation_status: string;
        ip_address: string;
        is_anonymous: boolean;
        author_id: string;
      } = {
        title: data.title,
        content: data.content,
        category_id: data.category_id,
        slug: uniqueSlug,
        is_pinned: false,
        is_locked: false,
        view_count: 0,
        reply_count: 0,
        last_reply_at: new Date().toISOString(),
        moderation_status: category.requires_moderation
          ? "pending"
          : "approved",
        ip_address: userIP,
        is_anonymous: !user || isTemporaryUser, // Mark temporary users as anonymous
        author_id: authorId,
      };

      console.log("DEBUG TOPIC: Final topicData before insert:", topicData);

      const { data: topic, error } = await supabase
        .from("topics")
        .insert(topicData)
        .select(
          `
          *,
          categories (name, slug, color)
        `
        )
        .single();

      if (error) {
        console.error("Error creating topic:", error);
        throw error;
      }

      console.log("Topic created successfully:", topic);

      // Log IP activity for topic creation - IP is guaranteed to exist
      try {
        const sessionId = sessionManager.getSessionId();
        await supabase.rpc("log_ip_activity", {
          p_ip_address: userIP,
          p_session_id: sessionId,
          p_activity_type: "topic_creation",
          p_content_id: topic.id,
          p_content_type: "topic",
          p_action_data: {
            title: data.title,
            category_id: data.category_id,
            author_type: user ? "authenticated" : "anonymous",
          },
        });
      } catch (logError) {
        console.error(
          "Failed to log IP activity for topic creation:",
          logError
        );
        // Don't throw - topic creation was successful
      }

      return topic;
    },
    onSuccess: (topic) => {
      // Invalidate and refetch topics for the category
      queryClient.invalidateQueries({
        queryKey: ["topics", topic.category_id],
      });
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });
};
