import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UrlMigration {
  id: string;
  old_url: string;
  new_url: string;
  url_type: 'topic' | 'post' | 'category' | 'other';
  old_topic_id?: number;
  old_post_id?: number;
  old_category_id?: number;
  new_topic_id?: string;
  new_post_id?: string;
  new_category_id?: string;
  priority: number;
  status: 'pending' | 'active' | 'disabled';
  last_modified_date?: string;
  redirect_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  notes?: string;
  match_confidence?: number;
  match_type?: 'exact' | 'title_similarity' | 'legacy_id' | 'generated';
}

// Fetch URL migrations
export const useUrlMigrations = (filters?: {
  status?: string;
  url_type?: string;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['url-migrations', filters],
    queryFn: async () => {
      let query = supabase
        .from('url_migrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.url_type) {
        query = query.eq('url_type', filters.url_type);
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as UrlMigration[];
    }
  });
};

// Find URL migration by old URL
export const useUrlMigrationByOldUrl = (oldUrl: string) => {
  return useQuery({
    queryKey: ['url-migration', oldUrl],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('url_migrations')
        .select('*')
        .eq('old_url', oldUrl)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      return data as UrlMigration | null;
    },
    enabled: !!oldUrl
  });
};

// Create URL migration
export const useCreateUrlMigration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (migration: Omit<UrlMigration, 'id' | 'created_at' | 'updated_at' | 'redirect_count'>) => {
      const { data, error } = await supabase
        .from('url_migrations')
        .insert([{
          ...migration,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['url-migrations'] });
      toast.success('URL migration created successfully');
    },
    onError: (error) => {
      console.error('Error creating URL migration:', error);
      toast.error('Failed to create URL migration');
    }
  });
};

// Update URL migration
export const useUpdateUrlMigration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<UrlMigration> }) => {
      const { data, error } = await supabase
        .from('url_migrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['url-migrations'] });
      toast.success('URL migration updated successfully');
    },
    onError: (error) => {
      console.error('Error updating URL migration:', error);
      toast.error('Failed to update URL migration');
    }
  });
};

// Delete URL migration
export const useDeleteUrlMigration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('url_migrations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['url-migrations'] });
      toast.success('URL migration deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting URL migration:', error);
      toast.error('Failed to delete URL migration');
    }
  });
};

// Increment redirect count
export const useIncrementRedirectCount = () => {
  return useMutation({
    mutationFn: async (migrationId: string) => {
      const { error } = await supabase
        .rpc('increment_redirect_count', { migration_id: migrationId });
      
      if (error) throw error;
    },
    onError: (error) => {
      console.error('Error incrementing redirect count:', error);
    }
  });
};

// Bulk create URL migrations
export const useBulkCreateUrlMigrations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (migrations: Array<Omit<UrlMigration, 'id' | 'created_at' | 'updated_at' | 'redirect_count' | 'created_by'>>) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      const migrationsWithUser = migrations.map(migration => ({
        ...migration,
        created_by: userId
      }));
      
      const { data, error } = await supabase
        .from('url_migrations')
        .insert(migrationsWithUser)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['url-migrations'] });
      toast.success(`${data.length} URL migrations created successfully`);
    },
    onError: (error) => {
      console.error('Error creating URL migrations:', error);
      toast.error('Failed to create URL migrations');
    }
  });
};