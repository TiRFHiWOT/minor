
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Post {
  id: string;
  content: string;
  author_id: string | null;
  topic_id: string;
  parent_post_id: string | null;
  created_at: string;
  updated_at: string;
  vote_score: number | null;
  moderation_status: string | null;
  ip_address?: string | null;
  is_anonymous?: boolean | null;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  parent_post?: Post;
}

interface UsePostsOptions {
  page?: number;
  limit?: number;
}

interface UsePostsResult {
  posts: Post[];
  totalCount: number;
}

export const usePosts = (topicId: string, options: UsePostsOptions = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ['posts', topicId, page, limit],
    queryFn: async (): Promise<UsePostsResult> => {
      console.log('Fetching posts for topic:', topicId, 'page:', page, 'with optimized function');
      
      // Use optimized enriched function - eliminates N+1 queries
      const [{ data: posts, error }, { data: totalCount, error: countError }] = await Promise.all([
        supabase.rpc('get_enriched_posts', {
          p_topic_id: topicId,
          p_limit: limit,
          p_offset: offset
        }),
        supabase.rpc('get_enriched_posts_count', {
          p_topic_id: topicId
        })
      ]);
      
      if (error) {
        console.error('Error fetching enriched posts:', error);
        throw error;
      }
      
      if (countError) {
        console.error('Error fetching posts count:', countError);
        throw countError;
      }

      if (!posts || posts.length === 0) {
        return { posts: [], totalCount: totalCount || 0 };
      }

      // Transform enriched data to match expected interface
      const enrichedPosts = posts.map(post => ({
        id: post.id,
        content: post.content,
        author_id: post.author_id,
        topic_id: post.topic_id,
        parent_post_id: post.parent_post_id,
        created_at: post.created_at,
        updated_at: post.updated_at,
        vote_score: null, // Not used in current UI
        moderation_status: post.moderation_status,
        ip_address: undefined, // IP address not available in forum_posts table
        is_anonymous: post.is_anonymous,
        profiles: post.author_username ? {
          username: post.author_username,
          avatar_url: post.author_avatar_url
        } : undefined,
        parent_post: post.parent_post_content ? {
          id: post.parent_post_id!,
          content: post.parent_post_content,
          author_id: null,
          topic_id: topicId,
          parent_post_id: null,
          created_at: post.parent_post_created_at!,
          updated_at: post.parent_post_created_at!,
          vote_score: null,
          moderation_status: post.parent_post_moderation_status,
          ip_address: undefined,
          is_anonymous: undefined,
          profiles: post.parent_post_author_username ? {
            username: post.parent_post_author_username,
            avatar_url: post.parent_post_author_avatar_url
          } : undefined
        } : undefined
      }));
      
      console.log('Optimized posts fetched:', enrichedPosts.length, 'posts in single query');
      return { posts: enrichedPosts as Post[], totalCount: totalCount || 0 };
    },
    enabled: !!topicId,
    staleTime: 2 * 60 * 1000, // 2 minutes - posts are more dynamic
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  });
};
