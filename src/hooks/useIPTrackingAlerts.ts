import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IPTrackingAlert {
  id: string;
  content_type: 'topic' | 'post';
  content_id: string;
  content_title?: string;
  created_at: string;
  author_id?: string;
  author_username?: string;
  category_name?: string;
}

export const useIPTrackingAlerts = () => {
  return useQuery({
    queryKey: ['ip-tracking-alerts'],
    queryFn: async () => {
      // Get topics without IP addresses
      const { data: topicsWithoutIP, error: topicsError } = await supabase
        .from('topics')
        .select(`
          id,
          title,
          created_at,
          author_id,
          categories!inner(name)
        `)
        .eq('ip_address', '0.0.0.0')
        .gte('created_at', '2025-07-14')
        .order('created_at', { ascending: false })
        .limit(50);

      if (topicsError) {
        console.error('Error fetching topics without IP:', topicsError);
      }

      // Get posts without IP addresses
      const { data: postsWithoutIP, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          author_id,
          topic_id,
          topics!inner(title, categories!inner(name))
        `)
        .eq('ip_address', '0.0.0.0')
        .gte('created_at', '2025-07-14')
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) {
        console.error('Error fetching posts without IP:', postsError);
      }

      const alerts: IPTrackingAlert[] = [];

      // Process topics
      if (topicsWithoutIP) {
        for (const topic of topicsWithoutIP) {
          let username = 'Anonymous';
          
          // Try to get username from profiles or temporary users
          if (topic.author_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', topic.author_id)
              .single();
            
            if (profile?.username) {
              username = profile.username;
            } else {
              // Check temporary users
              const { data: tempUser } = await supabase
                .from('temporary_users')
                .select('display_name')
                .eq('id', topic.author_id)
                .single();
              
              if (tempUser?.display_name) {
                username = "Guest";
              }
            }
          }

          alerts.push({
            id: topic.id,
            content_type: 'topic',
            content_id: topic.id,
            content_title: topic.title,
            created_at: topic.created_at,
            author_id: topic.author_id,
            author_username: username,
            category_name: (topic.categories as any)?.name
          });
        }
      }

      // Process posts
      if (postsWithoutIP) {
        for (const post of postsWithoutIP) {
          let username = 'Anonymous';
          
          // Try to get username from profiles or temporary users
          if (post.author_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', post.author_id)
              .single();
            
            if (profile?.username) {
              username = profile.username;
            } else {
              // Check temporary users
              const { data: tempUser } = await supabase
                .from('temporary_users')
                .select('display_name')
                .eq('id', post.author_id)
                .single();
              
              if (tempUser?.display_name) {
                username = "Guest";
              }
            }
          }

          alerts.push({
            id: `post-${post.id}`,
            content_type: 'post',
            content_id: post.id,
            content_title: `Post in: ${(post.topics as any)?.title}`,
            created_at: post.created_at,
            author_id: post.author_id,
            author_username: username,
            category_name: (post.topics as any)?.categories?.name
          });
        }
      }

      // Sort by creation date
      alerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return alerts;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};