import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UrlMigrationStats {
  total: number;
  active: number;
  pending: number;
  totalRedirects: number;
}

export const useUrlMigrationStats = (enableAutoRefresh = true) => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['url-migration-stats'],
    queryFn: async (): Promise<UrlMigrationStats> => {
      const fetchTime = new Date().toISOString();
      console.log('🔄 Fetching URL migration statistics at:', fetchTime);
      
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 Stats fetch - Current user:', user?.id, 'Auth error:', authError);
      
      const { data, error } = await supabase
        .from('url_migrations')
        .select(`
          id,
          status,
          redirect_count
        `);
      
      if (error) {
        console.error('❌ Error fetching URL migration stats:', error);
        throw error;
      }
      
      // Calculate stats from the full dataset
      const total = data.length;
      const active = data.filter(m => m.status === 'active').length;
      const pending = data.filter(m => m.status === 'pending').length;
      const totalRedirects = data.reduce((sum, m) => sum + (m.redirect_count || 0), 0);
      
      const stats = {
        total,
        active,
        pending,
        totalRedirects
      };
      
      console.log('📊 URL migration stats calculated:', {
        ...stats,
        fetchTime,
        dataSource: 'fresh'
      });
      
      return stats;
    },
    staleTime: enableAutoRefresh ? 30 * 1000 : 0, // 30 seconds or 0 for immediate refresh
    refetchOnWindowFocus: true,
    refetchInterval: enableAutoRefresh ? 2 * 60 * 1000 : false, // Auto-refresh every 2 minutes
  });

  // Manual refresh function
  const refreshStats = async () => {
    console.log('🔄 Manual refresh triggered for URL migration stats');
    
    // Invalidate both stats and migrations cache
    await queryClient.invalidateQueries({ queryKey: ['url-migration-stats'] });
    await queryClient.invalidateQueries({ queryKey: ['url-migrations'] });
    
    return query.refetch();
  };

  // Function to invalidate stats after mutations
  const invalidateStats = async () => {
    console.log('♻️ Invalidating URL migration stats cache');
    await queryClient.invalidateQueries({ queryKey: ['url-migration-stats'] });
  };

  return {
    ...query,
    refreshStats,
    invalidateStats,
    lastRefreshed: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
  };
};