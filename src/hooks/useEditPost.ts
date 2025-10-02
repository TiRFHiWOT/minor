import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Post } from "./usePosts";

interface EditPostParams {
  postId: string;
  content: string;
}

export const useEditPost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content }: EditPostParams) => {
      const { data, error } = await supabase
        .from("posts")
        .update({
          content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: unknown) => {
      // Update cached posts and topic queries immediately so the UI shows
      // the edited content without requiring a full page reload.
      try {
        const updatedPost = data as Partial<Post> & {
          topic_id?: string;
          topic_slug?: string;
          id?: string;
        };

        // Update any cached posts lists for the topic
        const postsQueries = queryClient.getQueriesData(["posts"]);
        postsQueries.forEach(([queryKey, value]) => {
          const key = queryKey as unknown as unknown[];
          // Expect queryKey like ['posts', topicId, page, limit]
          const topicId = key[1] as string | undefined;
          if (!topicId || topicId !== updatedPost.topic_id) return;
          if (!value || typeof value !== "object") return;
          const cached = value as { posts?: Post[]; totalCount?: number };
          if (Array.isArray(cached.posts)) {
            const newPosts = cached.posts.map((p: Post) =>
              p.id === updatedPost.id
                ? { ...p, ...(updatedPost as Partial<Post>) }
                : p
            );
            queryClient.setQueryData(queryKey, { ...cached, posts: newPosts });
          }
        });

        // Invalidate topic queries that may reference this topic so they refetch
        queryClient.invalidateQueries({ queryKey: ["topic"] });

        // Finally, invalidate posts queries to be safe (will trigger background refetch)
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      } catch (e) {
        // If cache update fails, still invalidate to ensure correctness
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      }
      toast({
        title: "Success",
        description: "Post updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post",
        variant: "destructive",
      });
    },
  });
};
