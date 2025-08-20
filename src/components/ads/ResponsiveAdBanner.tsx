import React, { useEffect, useRef } from 'react';

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
  
  // Ad slot mappings for your specific ad units
  const adSlots = {
    square: '2493498407',
    horizontal: '6641175715', 
    vertical: '2701930702'
  };
  
  const slot = adSlots[format];
  const clientId = 'ca-pub-5447109336224364';

  useEffect(() => {
    if (!adRef.current) {
      console.log(`AdSense ${format}: No ad element found`);
      return;
    }

    // Wait for AdSense script to be loaded
    const initializeAd = () => {
      try {
        console.log(`AdSense ${format}: Initializing ad with slot ${slot}`);
        
        // Initialize adsbygoogle array if it doesn't exist
        window.adsbygoogle = window.adsbygoogle || [];
        
        // Clear any existing ad content
        if (adRef.current) {
          adRef.current.innerHTML = '';
        }
        
        // Push the ad configuration
        window.adsbygoogle.push({});
        
        console.log(`AdSense ${format}: Ad pushed to queue`);
      } catch (error) {
        console.error(`AdSense ${format}: Error loading ad:`, error);
      }
    };

    // Check if AdSense script is already loaded
    if (window.adsbygoogle) {
      // Add a small delay to ensure DOM is fully ready
      const timer = setTimeout(initializeAd, 100);
      return () => clearTimeout(timer);
    } else {
      // Wait for AdSense script to load
      const checkAdSense = setInterval(() => {
        if (window.adsbygoogle) {
          clearInterval(checkAdSense);
          initializeAd();
        }
      }, 100);
      
      // Cleanup after 10 seconds if AdSense doesn't load
      const timeout = setTimeout(() => {
        clearInterval(checkAdSense);
        console.warn(`AdSense ${format}: Script didn't load within 10 seconds`);
      }, 10000);
      
      return () => {
        clearInterval(checkAdSense);
        clearTimeout(timeout);
      };
    }
  }, [slot, format]);

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