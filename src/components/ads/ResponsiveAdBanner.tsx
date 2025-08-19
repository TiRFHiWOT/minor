import React, { useEffect, useRef } from 'react';
import { useForumSettings } from '@/hooks/useForumSettings';
import { useCookieConsent } from '@/hooks/useCookieConsent';

interface ResponsiveAdBannerProps {
  slot: string;
  className?: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export const ResponsiveAdBanner: React.FC<ResponsiveAdBannerProps> = ({
  slot,
  className = '',
  format = 'auto',
  responsive = true
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const { getSetting } = useForumSettings();
  const { hasConsent } = useCookieConsent();
  
  const clientId = getSetting('google_adsense_client_id', '');
  const canShowAds = hasConsent('analytics') && clientId;

  useEffect(() => {
    if (!canShowAds || !adRef.current) return;

    try {
      // Initialize adsbygoogle array if it doesn't exist
      window.adsbygoogle = window.adsbygoogle || [];
      
      // Push the ad configuration
      window.adsbygoogle.push({});
    } catch (error) {
      console.error('Error loading AdSense ad:', error);
    }
  }, [canShowAds, slot]);

  if (!canShowAds) {
    return null;
  }

  return (
    <div className={`w-full flex justify-center py-4 ${className}`}>
      <div className="text-xs text-muted-foreground mb-1 text-center">Advertisement</div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
};