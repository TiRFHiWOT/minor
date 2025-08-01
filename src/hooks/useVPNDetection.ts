import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserIP, getIPGeolocation } from '@/utils/ipUtils';
import { useForumSettings } from '@/hooks/useForumSettings';

// Cache for VPN detection results to prevent repeated checks
const vpnCache = new Map<string, { isVPN: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useVPNDetection = () => {
  console.log('🔧 useVPNDetection hook initialized');
  const [isVPN, setIsVPN] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getSetting } = useForumSettings();
  
  // Get the current VPN detection setting to watch for changes
  const vpnDetectionEnabled = getSetting('vpn_detection_enabled', true);
  
  // Refs to prevent multiple simultaneous checks
  const isCheckingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  console.log('🔧 useVPNDetection hook state:', { isVPN, isLoading, error });

  // Memoized VPN detection function with debouncing and caching
  const checkVPNStatus = useCallback(async () => {
    // Prevent multiple simultaneous checks
    if (isCheckingRef.current) {
      console.log('🔧 VPN check already in progress, skipping...');
      return;
    }

    console.log('🔧 checkVPNStatus called with VPN detection enabled:', vpnDetectionEnabled);
    isCheckingRef.current = true;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (!vpnDetectionEnabled) {
        console.log('🔧 VPN detection disabled - allowing access');
        setIsVPN(false);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Starting VPN detection check...');
      
      // Get user's IP address with abort signal
      const ip = await getUserIP();
      
      if (abortControllerRef.current?.signal.aborted) {
        console.log('🔧 VPN check was aborted');
        return;
      }
      
      if (!ip) {
        console.warn('❌ Could not retrieve IP address for VPN check');
        setIsVPN(false); // Allow access if we can't determine IP
        return;
      }

      // Check cache first
      const cacheKey = `${ip}_${vpnDetectionEnabled}`;
      const cached = vpnCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('🔧 Using cached VPN result for IP:', ip, 'isVPN:', cached.isVPN);
        setIsVPN(cached.isVPN);
        setIsLoading(false);
        return;
      }

      console.log(`🌍 Checking VPN status for IP: ${ip}`);

      // Get geolocation data which includes VPN detection
      const geoData = await getIPGeolocation(ip);
      
      if (abortControllerRef.current?.signal.aborted) {
        console.log('🔧 VPN check was aborted after geolocation');
        return;
      }
      
      console.log('📍 Geolocation data received:', {
        ip,
        is_vpn: geoData?.is_vpn,
        is_proxy: geoData?.is_proxy,
        isp: geoData?.isp,
        country: geoData?.country_name
      });
      
      if (geoData && typeof geoData.is_vpn === 'boolean') {
        const isVPNDetected = geoData.is_vpn;
        
        // Cache the result
        vpnCache.set(cacheKey, { isVPN: isVPNDetected, timestamp: Date.now() });
        
        setIsVPN(isVPNDetected);
        
        if (isVPNDetected) {
          console.log('🚨 VPN DETECTED for IP:', ip, 'ISP:', geoData.isp);
        } else {
          console.log('✅ No VPN detected for IP:', ip, 'ISP:', geoData.isp);
        }
      } else {
        console.warn('⚠️ VPN status could not be determined from geolocation data:', geoData);
        setIsVPN(false); // Allow access if we can't determine VPN status
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🔧 VPN check was aborted');
        return;
      }
      
      console.error('💥 Error checking VPN status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check VPN status');
      setIsVPN(false); // Allow access on error to prevent breaking the site
    } finally {
      setIsLoading(false);
      isCheckingRef.current = false;
    }
  }, [vpnDetectionEnabled]);

  // Effect to run VPN check when component mounts or VPN detection setting changes
  useEffect(() => {
    console.log('🔧 useVPNDetection useEffect triggered, VPN detection enabled:', vpnDetectionEnabled);
    
    // Clear cache when VPN detection is disabled to ensure fresh check when re-enabled
    if (!vpnDetectionEnabled) {
      console.log('🔧 Clearing VPN cache due to disabled detection');
      vpnCache.clear();
    }
    
    checkVPNStatus();
  }, [checkVPNStatus, vpnDetectionEnabled]);

  // Cleanup effect to cancel ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isCheckingRef.current = false;
    };
  }, []);

  return {
    isVPN,
    isLoading,
    error,
    isBlocked: isVPN === true,
    recheckVPN: checkVPNStatus
  };
};