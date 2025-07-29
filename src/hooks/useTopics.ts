
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Topic {
  id: string;
  title: string;
  content: string | null;
  author_id: string;
  category_id: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  
  last_reply_at: string;
  created_at: string;
  updated_at: string;
  slug: string;
  last_post_id?: string;
  last_reply_username?: string | null;
  last_reply_avatar?: string | null;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
  categories?: {
    name: string;
    color: string;
    slug: string;
    parent_category_id?: string;
  };
}

export interface PaginatedTopicsResult {
  data: Topic[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export const useTopics = (categoryId?: string, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  return useQuery({
    queryKey: ['topics', categoryId, page, limit],
    queryFn: async () => {
      console.log('Fetching topics for category:', categoryId, 'with optimized function');
      
      // Use optimized enriched function - eliminates N+1 queries
      const [{ data: topics, error }, { data: totalCount, error: countError }] = await Promise.all([
        supabase.rpc('get_enriched_topics', {
          p_category_id: categoryId || null,
          p_limit: limit,
          p_offset: offset
        }),
        supabase.rpc('get_enriched_topics_count', {
          p_category_id: categoryId || null
        })
      ]);
      
      if (error) {
        console.error('Error fetching enriched topics:', error);
        throw error;
      }
      
      if (countError) {
        console.error('Error fetching topics count:', countError);
        throw countError;
      }

      if (!topics || topics.length === 0) {
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: page
        } as PaginatedTopicsResult;
      }

      // Transform enriched data to match expected interface
      const enrichedTopics = topics.map(topic => ({
        ...topic,
        profiles: topic.author_username ? {
          username: topic.author_username,
          avatar_url: topic.author_avatar_url
        } : null,
        categories: topic.category_name ? {
          name: topic.category_name,
          color: topic.category_color,
          slug: topic.category_slug,
          parent_category_id: topic.parent_category_id
        } : null,
        // Add last reply author fields for TopicTable
        last_reply_username: topic.last_reply_username || null,
        last_reply_avatar: topic.last_reply_avatar || null
      }));
      
      console.log('Optimized topics fetched:', enrichedTopics.length, 'topics in single query');
      
      const totalPages = Math.ceil((totalCount as number) / limit);
      
      return {
        data: enrichedTopics,
        totalCount: totalCount as number,
        totalPages,
        currentPage: page
      } as PaginatedTopicsResult;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - topics are dynamic but not constantly changing
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
};
