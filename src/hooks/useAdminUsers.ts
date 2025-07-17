import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminUser {
  id: string;
  username: string;
  email?: string;
  role: string;
  created_at: string;
  post_count: number;
  reputation: number;
}

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get users with their roles and post counts
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          created_at,
          reputation
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user emails from auth schema (admin only)
      const { data: emailData, error: emailError } = await supabase
        .rpc('get_admin_users_with_emails');

      if (emailError) throw emailError;

      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get post counts for each user
      const { data: postCounts, error: postsError } = await supabase
        .from('posts')
        .select('author_id')
        .not('author_id', 'is', null);

      if (postsError) throw postsError;

      // Count posts per user
      const postCountMap = new Map<string, number>();
      postCounts?.forEach(post => {
        if (post.author_id) {
          postCountMap.set(post.author_id, (postCountMap.get(post.author_id) || 0) + 1);
        }
      });

      // Create role map
      const roleMap = new Map<string, string>();
      userRoles?.forEach(userRole => {
        roleMap.set(userRole.user_id, userRole.role);
      });

      // Create email map
      const emailMap = new Map<string, string>();
      emailData?.forEach(userData => {
        emailMap.set(userData.id, userData.email);
      });

      // Combine data
      const users: AdminUser[] = profiles?.map(profile => ({
        id: profile.id,
        username: profile.username,
        email: emailMap.get(profile.id),
        role: roleMap.get(profile.id) || 'user',
        created_at: profile.created_at || '',
        post_count: postCountMap.get(profile.id) || 0,
        reputation: profile.reputation || 0,
      })) || [];

      return users;
    },
  });
};