import React, { useEffect, useRef } from 'react';
import { useForumSettings } from '@/hooks/useForumSettings';
import { useCookieConsent } from '@/hooks/useCookieConsent';

interface ResponsiveAdBannerProps {
  format: 'square' | 'horizontal' | 'vertical';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export const ResponsiveAdBanner: React.FC<ResponsiveAdBannerProps> = ({
  format,
  className = ''
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const { hasConsent } = useCookieConsent();
  
  // Ad slot mappings for your specific ad units
  const adSlots = {
    square: '2493498407',
    horizontal: '6641175715', 
    vertical: '2701930702'
  };
  
  const slot = adSlots[format];
  const clientId = 'ca-pub-5447109336224364';
  const canShowAds = hasConsent('analytics');

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
    <div className={`w-full flex flex-col items-center py-4 ${className}`}>
      <div className="text-xs text-muted-foreground mb-2 text-center">Advertisement</div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};