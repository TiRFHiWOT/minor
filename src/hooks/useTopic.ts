
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTopic = (identifier: string) => {
  return useQuery({
    queryKey: ['topic', identifier],
    queryFn: async () => {
      console.log('Fetching topic by identifier:', identifier);
      
      // Check if identifier is a UUID (legacy) or a slug
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      let query = supabase
        .from('topics')
        .select(`
          *,
          categories (name, color, slug, parent_category_id)
        `)
        .eq('moderation_status', 'approved');
      
      if (isUUID) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('slug', identifier);
      }
      
      const { data: topicData, error } = await query.single();
      
      if (error) {
        console.error('Error fetching topic:', error);
        throw error;
      }
      
      // Fetch author information separately based on whether it's a temporary user or regular user
      let authorInfo = null;
      if (topicData.author_id) {
        // First try to get from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', topicData.author_id)
          .maybeSingle();
        
        if (profile) {
          authorInfo = { profiles: profile };
        } else {
          // Try temporary users
          const { data: tempUser } = await supabase
            .from('temporary_users')
            .select('display_name')
            .eq('id', topicData.author_id)
            .maybeSingle();
          
          if (tempUser) {
            authorInfo = { temporary_users: { display_name: "Guest" } };
          }
        }
      }
      
      // Get last post ID if topic has replies
      let lastPostId = null;
      if (topicData.reply_count > 0) {
        const { data: lastPost } = await supabase
          .from('posts')
          .select('id')
          .eq('topic_id', topicData.id)
          .eq('moderation_status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        lastPostId = lastPost?.id || null;
      }

      // Combine the data
      const data = {
        ...topicData,
        last_post_id: lastPostId,
        ...authorInfo
      };
      
      // Increment view count using the topic ID
      await supabase.rpc('increment_view_count', { topic_id: data.id });
      
      console.log('Topic fetched:', data);
      return data;
    },
    enabled: !!identifier,
  });
};
