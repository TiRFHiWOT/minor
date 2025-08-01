import { useState, useEffect, useCallback } from 'react';
import { getUserIP, getIPGeolocation } from '@/utils/ipUtils';
import { useForumSettings } from '@/hooks/useForumSettings';

export const useVPNDetection = () => {
  console.log('🔧 useVPNDetection hook initialized');
  const [isVPN, setIsVPN] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getSetting } = useForumSettings();

  console.log('🔧 useVPNDetection hook state:', { isVPN, isLoading, error });

  const checkVPNStatus = useCallback(async () => {
    console.log('🔧 checkVPNStatus called');
    
    // Check if VPN detection is enabled
    const vpnDetectionEnabled = getSetting('vpn_detection_enabled', true);
    console.log('🔧 VPN detection enabled:', vpnDetectionEnabled);
    
    if (!vpnDetectionEnabled) {
      console.log('🔧 VPN detection disabled - allowing access');
      setIsVPN(false);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Starting VPN detection check...');
      
      // Get user's IP address
      const ip = await getUserIP();
      
      if (!ip) {
        console.warn('❌ Could not retrieve IP address for VPN check');
        setIsVPN(false); // Allow access if we can't determine IP
        return;
      }

      console.log(`🌍 Checking VPN status for IP: ${ip}`);

      // Get geolocation data which includes VPN detection
      const geoData = await getIPGeolocation(ip);
      
      console.log('📍 Geolocation data received:', {
        ip,
        is_vpn: geoData?.is_vpn,
        is_proxy: geoData?.is_proxy,
        isp: geoData?.isp,
        country: geoData?.country_name
      });
      
      if (geoData && typeof geoData.is_vpn === 'boolean') {
        setIsVPN(geoData.is_vpn);
        
        if (geoData.is_vpn) {
          console.log('🚨 VPN DETECTED for IP:', ip, 'ISP:', geoData.isp);
        } else {
          console.log('✅ No VPN detected for IP:', ip, 'ISP:', geoData.isp);
        }
      } else {
        console.warn('⚠️ VPN status could not be determined from geolocation data:', geoData);
        setIsVPN(false); // Allow access if we can't determine VPN status
      }
    } catch (err) {
      console.error('💥 Error checking VPN status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check VPN status');
      setIsVPN(false); // Allow access on error to prevent breaking the site
    } finally {
      setIsLoading(false);
    }
  }, [getSetting]);

  useEffect(() => {
    console.log('🔧 useVPNDetection useEffect triggered');
    checkVPNStatus();
  }, [checkVPNStatus]);

  return {
    isVPN,
    isLoading,
    error,
    isBlocked: isVPN === true,
    recheckVPN: checkVPNStatus
  };
};