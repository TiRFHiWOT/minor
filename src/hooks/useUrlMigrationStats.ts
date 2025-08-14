import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UrlMigrationStats {
  total: number;
  active: number;
  pending: number;
  totalRedirects: number;
}

export const useUrlMigrationStats = () => {
  return useQuery({
    queryKey: ['url-migration-stats'],
    queryFn: async (): Promise<UrlMigrationStats> => {
      console.log('Fetching URL migration statistics');
      
      const { data, error } = await supabase
        .from('url_migrations')
        .select(`
          id,
          status,
          redirect_count
        `);
      
      if (error) {
        console.error('Error fetching URL migration stats:', error);
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
      
      console.log('URL migration stats calculated:', stats);
      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};