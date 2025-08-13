import { useState, useEffect, useCallback, useRef } from 'react';
import { getUserIP, getIPGeolocation } from '@/utils/ipUtils';
import { useForumSettings } from '@/hooks/useForumSettings';
import { shouldWhitelistFromVPN, getBotInfo } from '@/utils/botDetection';

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

  console.log('🔧 useVPNDetection hook state:', { isVPN, isLoading, error, vpnDetectionEnabled });

  // Immediately set safe defaults when VPN detection is disabled
  useEffect(() => {
    if (!vpnDetectionEnabled) {
      console.log('🔧 VPN detection disabled - setting safe defaults immediately and clearing cache');
      setIsVPN(false);
      setIsLoading(false);
      setError(null);
      // Clear the cache to ensure fresh detection when re-enabled
      vpnCache.clear();
      return;
    }
  }, [vpnDetectionEnabled]);

  // Memoized VPN detection function with comprehensive safeguards
  const checkVPNStatus = useCallback(async () => {
    console.log('🛡️ VPN Detection: Starting check, enabled:', vpnDetectionEnabled);
    
    // CRITICAL: If VPN detection is disabled, bypass ALL VPN logic immediately
    if (!vpnDetectionEnabled) {
      console.log('🛡️ VPN detection disabled - bypassing all checks and allowing access');
      setIsVPN(false);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    // CRITICAL: Check for bots first - never block legitimate crawlers/ads  
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    
    // Get user IP for comprehensive whitelist checking
    let userIP: string | null = null;
    try {
      userIP = await getUserIP();
    } catch (err) {
      console.warn('🛡️ Could not determine user IP for bot checking:', err);
    }
    
    if (shouldWhitelistFromVPN(userAgent, userIP || undefined)) {
      console.log('🤖 Traffic whitelisted - bypassing VPN check completely');
      setIsVPN(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Prevent concurrent checks
    if (isCheckingRef.current) {
      console.log('🛡️ VPN check already in progress, skipping');
      return;
    }

    isCheckingRef.current = true;
    setIsLoading(true);
    setError(null);

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (!userIP) {
        userIP = await getUserIP();
      }
      
      if (!userIP) {
        console.warn('🛡️ Could not determine user IP - allowing access (fail-safe)');
        setIsVPN(false);
        setIsLoading(false);
        isCheckingRef.current = false;
        return;
      }

      // Check cache first
      const cached = vpnCache.get(userIP);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        console.log('🛡️ Using cached VPN result for IP:', userIP, cached.isVPN);
        setIsVPN(cached.isVPN);
        setIsLoading(false);
        isCheckingRef.current = false;
        return;
      }

      // Get geolocation data
      const geoData = await getIPGeolocation(userIP);
      if (abortControllerRef.current?.signal.aborted) {
        console.log('🛡️ VPN check was aborted');
        return;
      }

      const isVPNDetected = geoData?.is_vpn || geoData?.is_proxy || false;
      
      // Cache the result
      vpnCache.set(userIP, {
        isVPN: isVPNDetected,
        timestamp: Date.now()
      });

      console.log('🛡️ VPN Detection Result:', { 
        ip: userIP, 
        isVPN: isVPNDetected, 
        country: geoData?.country_name,
        isp: geoData?.isp 
      });

      setIsVPN(isVPNDetected);
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🛡️ VPN check was aborted');
        return;
      }
      
      console.error('🛡️ VPN detection error:', err);
      setError(err instanceof Error ? err.message : 'VPN detection failed');
      // CRITICAL: On error, default to allowing access (fail-safe approach)
      console.log('🛡️ Error occurred - defaulting to allow access (revenue protection)');
      setIsVPN(false);
    } finally {
      setIsLoading(false);
      isCheckingRef.current = false;
    }
  }, [vpnDetectionEnabled]);

  // Effect to set initial defaults if VPN detection is disabled
  useEffect(() => {
    if (!vpnDetectionEnabled) {
      console.log('🛡️ VPN detection disabled - setting safe defaults and bypassing all checks');
      setIsVPN(false);
      setIsLoading(false);
      setError(null);
      return;
    }
  }, [vpnDetectionEnabled]);

  // Effect to check VPN status on mount and when enabled changes
  useEffect(() => {
    // Only run VPN checks if detection is enabled
    if (vpnDetectionEnabled) {
      console.log('🛡️ VPN detection enabled - running check');
      checkVPNStatus();
    } else {
      console.log('🛡️ VPN detection disabled - skipping check entirely');
    }
  }, [vpnDetectionEnabled, checkVPNStatus]);

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