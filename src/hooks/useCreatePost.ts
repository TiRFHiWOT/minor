import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { sessionManager } from "@/utils/sessionManager";
import { getMandatoryUserIP } from "@/utils/ipUtils";
import { useEnhancedSpamDetection } from "./useEnhancedSpamDetection";
import {
  checkRateLimit as utilCheckRateLimit,
  getUserAccountAge,
  NEW_USER_LIMITS,
  ESTABLISHED_USER_LIMITS,
} from "@/utils/rateLimit";

interface CreatePostData {
  content: string;
  topic_id: string;
  parent_post_id?: string | null;
}

export const useCreatePost = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { analyzeContent } = useEnhancedSpamDetection();
  // ...existing code...

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      // Enhanced spam detection: block if spam is detected
      const spamResult = await analyzeContent(data.content, "post");
      console.log("1234[SpamDetection] analyzeContent result:", spamResult);
      if (!spamResult.allowed) {
        throw new Error(
          spamResult.message ||
            "Your post was flagged as spam and cannot be posted."
        );
      }
      console.log("Creating post - authenticated user:", !!user);
      const authorId = user ? user.id : sessionManager.getTempUserId();
      const userIP = await getMandatoryUserIP();
      const accountAge = user ? await getUserAccountAge(user.id) : 0;
      const config = accountAge < 7 ? NEW_USER_LIMITS : ESTABLISHED_USER_LIMITS;
      // Check rate limit for user
      const userLimit = await utilCheckRateLimit({
        userId: authorId,
        ip: undefined,
        config,
      });
      if (!userLimit.allowed) throw new Error(userLimit.reason);
      // Check rate limit for IP
      const ipLimit = await utilCheckRateLimit({
        userId: undefined,
        ip: userIP,
        config,
      });
      if (!ipLimit.allowed) throw new Error(ipLimit.reason);
      // ...existing code...

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
        // Continue with creation if check fails to avoid blocking legitimate posts
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
            `You are not allowed to make posts with: ${bannedWords}`
          );
        }
      }

      // Get the topic to validate its category and check moderation requirements
      const { data: topic, error: topicError } = await supabase
        .from("topics")
        .select("category_id, categories(level, name, requires_moderation)")
        .eq("id", data.topic_id)
        .single();

      if (topicError) {
        throw new Error("Invalid topic");
      }

      // Validate that the topic's category is level 2 or 3
      if (topic.categories?.level !== 2 && topic.categories?.level !== 3) {
        throw new Error(
          `Posts can only be created in discussion or age group categories. This topic is in "${topic.categories?.name}" which is for browsing only.`
        );
      }

      // Get user's IP address for admin tracking - MANDATORY
      // userIP already declared above, no need to reassign

      // Determine moderation status: all posts are auto-approved
      let moderationStatus = "approved";
      if (topic.categories?.requires_moderation) {
        // Category-specific moderation requirements (currently disabled for all categories)
        moderationStatus = "pending";
      }

      const postData: {
        content: string;
        topic_id: string;
        parent_post_id: string | null;
        moderation_status: string;
        ip_address: string;
        author_id?: string;
        is_anonymous?: boolean;
      } = {
        content: data.content,
        topic_id: data.topic_id,
        parent_post_id: data.parent_post_id || null,
        moderation_status: moderationStatus,
        ip_address: userIP,
      };

      if (user) {
        // Authenticated user
        postData.author_id = user.id;
        postData.is_anonymous = false;
      } else {
        // Anonymous user - use temporary user ID
        const tempUserId = sessionManager.getTempUserId();
        console.log("Using temp user ID for post:", tempUserId);
        if (!tempUserId) {
          console.error(
            "No temporary user session available during post creation"
          );
          throw new Error(
            "Anonymous session expired. Please refresh the page and try again."
          );
        }
        postData.author_id = tempUserId;
        postData.is_anonymous = true;
      }

      console.log("Inserting post with data:", postData);
      const { data: post, error } = await supabase
        .from("posts")
        .insert(postData)
        .select()
        .single();

      if (error) {
        console.error("Database error inserting post:", error);
        if (error.code === "PGRST116") {
          throw new Error(
            "Post creation failed - you may need to refresh the page and try again."
          );
        }
        throw new Error(`Failed to create post: ${error.message}`);
      }

      console.log("Post created successfully:", post);

      // Update topic's last_reply_at using secure function
      const { error: updateError } = await supabase.rpc(
        "update_topic_last_reply",
        {
          topic_id: data.topic_id,
        }
      );

      if (updateError) {
        console.error("Error updating topic last reply:", updateError);
      }

      // Increment reply count separately using raw SQL
      const { error: incrementError } = await supabase.rpc(
        "increment_reply_count",
        {
          topic_id: data.topic_id,
        }
      );

      if (incrementError) {
        console.error("Error incrementing reply count:", incrementError);
      }

      // No need for manual rate limiting - it's handled by the temp user system

      return post;
    },
    onSuccess: (post, variables) => {
      // Show appropriate success message based on moderation status
      if (post.moderation_status === "pending") {
        // This will be shown via toast in the component that calls this hook
      }

      // Only invalidate queries if post is approved (visible immediately)
      if (post.moderation_status === "approved") {
        // Invalidate and refetch posts for the topic
        queryClient.invalidateQueries({ queryKey: ["posts", post.topic_id] });

        // Invalidate ALL topics queries to ensure proper refresh
        queryClient.invalidateQueries({ queryKey: ["topics"] });
        queryClient.invalidateQueries({ queryKey: ["topics", undefined] });
        queryClient.invalidateQueries({ queryKey: ["hot-topics"] });

        // Force refetch to ensure immediate update
        queryClient.refetchQueries({ queryKey: ["topics"] });
        queryClient.refetchQueries({ queryKey: ["topics", undefined] });
      }
    },
  });
};
