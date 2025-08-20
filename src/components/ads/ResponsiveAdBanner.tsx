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
    const adElement = adRef.current;
    if (!adElement) {
      console.log(`AdSense ${format}: No ad element found`);
      return;
    }

    console.log(`AdSense ${format}: Starting initialization with slot ${slot}`);

    // Wait for AdSense script to be loaded and DOM to be ready
    const initializeAd = () => {
      try {
        console.log(`AdSense ${format}: Checking if AdSense is ready...`);
        
        // Ensure window.adsbygoogle exists
        if (!window.adsbygoogle) {
          console.log(`AdSense ${format}: AdSense not ready, waiting...`);
          return false;
        }

        // Check if ad element is still in DOM and visible
        if (!document.contains(adElement)) {
          console.log(`AdSense ${format}: Ad element no longer in DOM`);
          return false;
        }

        console.log(`AdSense ${format}: Initializing ad with client ${clientId} and slot ${slot}`);
        
        // Clear any existing content from the ad element
        adElement.innerHTML = '';
        
        // Add a small delay to ensure the element is properly cleared
        setTimeout(() => {
          try {
            // Push to AdSense queue for processing
            console.log(`AdSense ${format}: Pushing ad to AdSense queue...`);
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            
            console.log(`AdSense ${format}: Ad successfully pushed to queue`);
            
            // Check if ad loaded after a delay
            setTimeout(() => {
              if (adElement.innerHTML.trim() === '') {
                console.warn(`AdSense ${format}: Ad slot ${slot} appears to be empty after 3 seconds. Check AdSense dashboard for:
                  - Ad unit status (active/inactive)
                  - Site approval status
                  - Ad serving limits
                  - Inventory availability`);
              } else {
                console.log(`AdSense ${format}: Ad content detected in slot ${slot}`);
              }
            }, 3000);
            
          } catch (pushError) {
            console.error(`AdSense ${format}: Error pushing to AdSense queue:`, pushError);
          }
        }, 50);
        
        return true;
      } catch (error) {
        console.error(`AdSense ${format}: Error during initialization:`, error);
        return false;
      }
    };

    // Initialize immediately if AdSense is ready
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      console.log(`AdSense ${format}: AdSense already loaded, initializing immediately`);
      // Add small delay to ensure DOM is stable
      const timer = setTimeout(() => initializeAd(), 250);
      return () => clearTimeout(timer);
    }

    // Wait for AdSense script to load
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds total
    
    console.log(`AdSense ${format}: Waiting for AdSense script to load...`);
    
    const checkAdSense = setInterval(() => {
      attempts++;
      
      if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        console.log(`AdSense ${format}: AdSense script loaded after ${attempts * 100}ms`);
        clearInterval(checkAdSense);
        
        // Add delay to ensure script is fully initialized
        setTimeout(() => initializeAd(), 200);
      } else if (attempts >= maxAttempts) {
        console.error(`AdSense ${format}: AdSense script failed to load after ${maxAttempts * 100}ms. Please check:
          - Internet connection
          - Ad blocker settings
          - AdSense script in index.html
          - Browser console for script errors`);
        clearInterval(checkAdSense);
      }
    }, 100);
    
    return () => {
      clearInterval(checkAdSense);
    };
  }, [slot, format, clientId]);

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