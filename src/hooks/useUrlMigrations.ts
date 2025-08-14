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

// Bulk create URL migrations with duplicate handling
export const useBulkCreateUrlMigrations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (migrations: Array<Omit<UrlMigration, 'id' | 'created_at' | 'updated_at' | 'redirect_count' | 'created_by'>>) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      // For reprocessing, we allow overwriting existing URLs
      const migrationsWithUser = migrations.map(migration => ({
        ...migration,
        created_by: userId,
        status: 'pending' as const // Force all new migrations to pending
      }));
      
      // Use upsert to handle duplicates during reprocessing
      const { data, error } = await supabase
        .from('url_migrations')
        .upsert(migrationsWithUser, { 
          onConflict: 'old_url',
          ignoreDuplicates: false 
        })
        .select();
      
      if (error) throw error;
      return { data, existingCount: 0, newCount: migrationsWithUser.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['url-migrations'] });
      toast.success(`${result.newCount} URL migrations processed with enhanced preservation logic.`);
    },
    onError: (error: any) => {
      console.error('Error creating URL migrations:', error);
      toast.error('Failed to create URL migrations');
    }
  });
};

// Clear all existing migrations for reprocessing
export const useClearAllUrlMigrations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('url_migrations')
        .update({ status: 'disabled' })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['url-migrations'] });
      toast.success('All URL migrations disabled for reprocessing');
    },
    onError: (error) => {
      console.error('Error clearing URL migrations:', error);
      toast.error('Failed to clear URL migrations');
    }
  });
};

// Bulk update URL migrations status
export const useBulkUpdateUrlMigrations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<UrlMigration> }) => {
      // Special handling for undefined URLs bulk operation
      if (ids.length === 0 && updates.status === 'disabled') {
        const { data, error } = await supabase
          .from('url_migrations')
          .update(updates)
          .eq('status', 'active')
          .like('new_url', '%/undefined/%')
          .select();
        
        if (error) throw error;
        return data;
      }
      
      const { data, error } = await supabase
        .from('url_migrations')
        .update(updates)
        .in('id', ids)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['url-migrations'] });
      toast.success(`Updated ${data.length} URL migrations`);
    },
    onError: (error) => {
      console.error('Error bulk updating URL migrations:', error);
      toast.error('Failed to update URL migrations');
    }
  });
};

// Get quality metrics for URL migrations
export const useUrlMigrationQualityMetrics = () => {
  return useQuery({
    queryKey: ['url-migration-quality-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('url_migrations')
        .select('match_confidence, status, new_url, url_type, created_at');
      
      if (error) throw error;
      
      // Calculate quality metrics
      const totalMigrations = data.length;
      const activeWithUndefined = data.filter(m => m.status === 'active' && m.new_url.includes('/undefined/')).length;
      const highConfidenceActive = data.filter(m => m.status === 'active' && (m.match_confidence || 0) > 80).length;
      const lowConfidenceActive = data.filter(m => m.status === 'active' && (m.match_confidence || 0) < 50).length;
      
      // Group by confidence ranges
      const confidenceRanges = {
        '90-100%': data.filter(m => (m.match_confidence || 0) >= 90).length,
        '80-89%': data.filter(m => (m.match_confidence || 0) >= 80 && (m.match_confidence || 0) < 90).length,
        '70-79%': data.filter(m => (m.match_confidence || 0) >= 70 && (m.match_confidence || 0) < 80).length,
        '50-69%': data.filter(m => (m.match_confidence || 0) >= 50 && (m.match_confidence || 0) < 70).length,
        'Below 50%': data.filter(m => (m.match_confidence || 0) < 50).length,
      };
      
      return {
        totalMigrations,
        activeWithUndefined,
        highConfidenceActive,
        lowConfidenceActive,
        confidenceRanges,
        undefinedPercentage: Math.round((activeWithUndefined / totalMigrations) * 100),
        needsReview: lowConfidenceActive + activeWithUndefined
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};