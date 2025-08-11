import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VPNTrafficStats {
  total_vpn_visits_today: number;
  unique_vpn_ips_today: number;
  vpn_post_attempts_blocked: number;
  total_blocked_attempts: number;
  vpn_percentage: number;
  active_vpn_users: number;
}

export const useVPNTrafficStats = () => {
  return useQuery({
    queryKey: ['vpn-traffic-stats'],
    queryFn: async () => {
      console.log('🔍 Fetching VPN traffic stats...');
      
      try {
        // Get VPN visits today
        const { data: vpnVisits, error: vpnError } = await supabase
          .from('ip_visit_tracking')
          .select('ip_address, is_vpn')
          .eq('is_vpn', true)
          .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');

        if (vpnError) {
          console.error('❌ Error fetching VPN visits:', vpnError);
          throw vpnError;
        }

        console.log('📊 VPN visits found:', vpnVisits?.length || 0);

        // Get active VPN users (users active in the last 30 minutes with VPN IPs)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: activeVPNVisits, error: activeVPNError } = await supabase
          .from('ip_visit_tracking')
          .select('ip_address, session_id')
          .eq('is_vpn', true)
          .gte('created_at', thirtyMinutesAgo);

        if (activeVPNError) {
          console.error('❌ Error fetching active VPN visits:', activeVPNError);
          throw activeVPNError;
        }

        // Count unique active VPN users (by IP and session)
        const activeVPNUsers = new Set(
          activeVPNVisits?.map(visit => `${visit.ip_address}_${visit.session_id}`) || []
        ).size;

        console.log('👥 Active VPN users found:', activeVPNUsers);

        // Get total visits today for percentage calculation
        const { data: totalVisits, error: totalError } = await supabase
          .from('ip_visit_tracking')
          .select('id')
          .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');

        if (totalError) {
          console.error('❌ Error fetching total visits:', totalError);
          throw totalError;
        }

        // Get blocked attempts from anonymous_post_tracking
        const { data: blockedAttempts, error: blockedError } = await supabase
          .from('anonymous_post_tracking')
          .select('id, is_blocked, ip_address')
          .eq('is_blocked', true)
          .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');

        if (blockedError) {
          console.error('❌ Error fetching blocked attempts:', blockedError);
          throw blockedError;
        }

        console.log('🚫 Total blocked attempts:', blockedAttempts?.length || 0);

        // Get VPN IPs from geolocation cache
        const { data: vpnIPs, error: vpnIPsError } = await supabase
          .from('ip_geolocation_cache')
          .select('ip_address')
          .eq('is_vpn', true);

        if (vpnIPsError) {
          console.error('❌ Error fetching VPN IPs:', vpnIPsError);
          throw vpnIPsError;
        }

        // Create a Set of known VPN IPs for fast lookup
        const vpnIPSet = new Set(vpnIPs?.map(item => item.ip_address.toString()) || []);
        
        // Count VPN-specific blocked attempts by matching IPs
        const vpnBlockedAttempts = blockedAttempts?.filter(attempt => 
          vpnIPSet.has(attempt.ip_address.toString())
        ) || [];

        console.log('🔒 VPN blocked attempts:', vpnBlockedAttempts.length);

        const uniqueVPNIPs = new Set(vpnVisits?.map(v => v.ip_address) || []).size;
        const totalVPNVisits = vpnVisits?.length || 0;
        const totalVisitsCount = totalVisits?.length || 0;
        const vpnPercentage = totalVisitsCount > 0 ? (totalVPNVisits / totalVisitsCount) * 100 : 0;

        const stats: VPNTrafficStats = {
          total_vpn_visits_today: totalVPNVisits,
          unique_vpn_ips_today: uniqueVPNIPs,
          vpn_post_attempts_blocked: vpnBlockedAttempts.length,
          total_blocked_attempts: blockedAttempts?.length || 0,
          vpn_percentage: Math.round(vpnPercentage * 100) / 100,
          active_vpn_users: activeVPNUsers
        };

        console.log('📈 VPN Stats computed:', stats);
        return stats;
        
      } catch (error) {
        console.error('💥 Fatal error in VPN stats:', error);
        throw error;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    retryDelay: 1000,
  });
};