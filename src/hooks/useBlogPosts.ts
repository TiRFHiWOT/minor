import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type BlogPost = Database['public']['Tables']['blog_posts']['Row'];
type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert'];
type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update'];

interface BlogPostWithAuthor extends BlogPost {
  author_username?: string;
  author_avatar_url?: string;
}

export const useBlogPosts = (options?: {
  category?: string;
  status?: 'draft' | 'published' | 'archived';
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['blog-posts', options],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          profiles:author_id (
            username,
            avatar_url
          )
        `)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (options?.category && options.category !== 'All') {
        query = query.eq('category', options.category);
      }

      if (options?.status) {
        query = query.eq('published_status', options.status);
      } else {
        // Default to published posts for public view
        query = query.eq('published_status', 'published');
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data as any[]).map((post): BlogPostWithAuthor => ({
        ...post,
        author_username: post.profiles?.username,
        author_avatar_url: post.profiles?.avatar_url,
      }));
    },
  });
};

export const useBlogPost = (slug: string) => {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          profiles:author_id (
            username,
            avatar_url
          )
        `)
        .eq('slug', slug)
        .eq('published_status', 'published')
        .single();

      if (error) throw error;

      const blogPost = data as any;
      return {
        ...blogPost,
        author_username: blogPost.profiles?.username,
        author_avatar_url: blogPost.profiles?.avatar_url,
      } as BlogPostWithAuthor;
    },
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<BlogPostInsert, 'slug'> & { title: string }) => {
      // Generate slug from title
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_blog_slug', { title_text: data.title });
      
      if (slugError) throw slugError;

      const blogPostData: BlogPostInsert = {
        ...data,
        slug: slugData,
      };

      const { data: result, error } = await supabase
        .from('blog_posts')
        .insert(blogPostData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: BlogPostUpdate & { id: string }) => {
      const { data: result, error } = await supabase
        .from('blog_posts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
};

// Admin-specific hook for all blog posts regardless of status
export const useAdminBlogPosts = (options?: {
  category?: string;
  status?: 'draft' | 'published' | 'archived' | 'All';
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['admin-blog-posts', options],
    queryFn: async () => {
      console.log('Admin blog posts query running with options:', options);
      
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Don't filter by status if it's 'All' or undefined - show all posts for admin
      if (options?.category && options.category !== 'All') {
        query = query.eq('category', options.category);
      }

      if (options?.status && options.status !== 'All') {
        query = query.eq('published_status', options.status);
      }

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      console.log('Executing admin blog query...');
      const { data, error } = await query;

      if (error) {
        console.error('Admin blog query error:', error);
        throw error;
      }

      console.log('Admin blog query result:', data);

      const processedData = (data as any[]).map((post): BlogPostWithAuthor => ({
        ...post,
        author_username: post.profiles?.username,
        author_avatar_url: post.profiles?.avatar_url,
      }));

      console.log('Processed admin blog data:', processedData);
      return processedData;
    },
    enabled: true, // Always enable for admin
    staleTime: 0, // Always refetch for admin to get latest data
  });
};