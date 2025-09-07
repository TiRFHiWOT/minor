// src/utils/rateLimit.ts
// Utility for post/topic rate limiting by user and IP
import { supabase } from "@/integrations/supabase/client";

export type RateLimitType = "minute" | "hour" | "day";

export interface RateLimitConfig {
  minGapSeconds?: number;
  minute: number;
  hour: number;
  day: number;
}

export const NEW_USER_LIMITS: RateLimitConfig = {
  minGapSeconds: 30,
  minute: 3,
  hour: 10,
  day: 25,
};

export const ESTABLISHED_USER_LIMITS: RateLimitConfig = {
  minute: 10,
  hour: 30,
  day: 100,
};

export async function getUserAccountAge(userId: string): Promise<number> {
  // Returns account age in days
  const { data, error } = await supabase
    .from("profiles")
    .select("created_at")
    .eq("id", userId)
    .single();
  if (error || !data) return 0;
  const created = new Date(data.created_at);
  const now = new Date();
  return Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export async function getRecentPosts({
  userId,
  ip,
  since,
}: {
  userId?: string;
  ip?: string;
  since: Date;
}) {
  let query = supabase
    .from("posts")
    .select("created_at")
    .order("created_at", { ascending: false });
  if (userId) query = query.eq("author_id", userId);
  if (ip) query = query.eq("ip_address", ip);
  query = query.gte("created_at", since.toISOString());
  const { data, error } = await query;
  return data || [];
}

export async function checkRateLimit({
  userId,
  ip,
  config,
}: {
  userId?: string;
  ip?: string;
  config: RateLimitConfig;
}) {
  const now = new Date();
  // Check minute
  const minuteAgo = new Date(now.getTime() - 60 * 1000);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const postsLastMinute = await getRecentPosts({
    userId,
    ip,
    since: minuteAgo,
  });
  const postsLastHour = await getRecentPosts({ userId, ip, since: hourAgo });
  const postsLastDay = await getRecentPosts({ userId, ip, since: dayAgo });

  if (config.minGapSeconds && postsLastMinute.length > 0) {
    const lastPost = new Date(postsLastMinute[0].created_at);
    if (now.getTime() - lastPost.getTime() < config.minGapSeconds * 1000) {
      return {
        allowed: false,
        reason: `You must wait ${config.minGapSeconds} seconds between posts.`,
      };
    }
  }
  if (postsLastMinute.length >= config.minute) {
    return {
      allowed: false,
      reason: `Rate limit: max ${config.minute} posts per minute.`,
    };
  }
  if (postsLastHour.length >= config.hour) {
    return {
      allowed: false,
      reason: `Rate limit: max ${config.hour} posts per hour.`,
    };
  }
  if (postsLastDay.length >= config.day) {
    return {
      allowed: false,
      reason: `Rate limit: max ${config.day} posts per day.`,
    };
  }
  return { allowed: true };
}
