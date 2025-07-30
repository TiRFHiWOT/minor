import React, { useEffect, useRef } from 'react';
import { useActiveAdSpaces } from '@/hooks/useAdSpaces';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForumSettings } from '@/hooks/useForumSettings';
import DOMPurify from 'dompurify';

interface DynamicAdSpaceProps {
  location: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const DynamicAdSpace: React.FC<DynamicAdSpaceProps> = ({ location, className = '' }) => {
  const isMobile = useIsMobile();
  const { getSetting } = useForumSettings();
  const deviceType = isMobile ? 'mobile' : 'desktop';
  const adContainerRef = useRef<HTMLDivElement>(null);
  
  // Check if advertising is enabled and device-specific settings
  const advertisingEnabled = getSetting('advertising_enabled', 'true') === 'true';
  const desktopEnabled = getSetting('ads_desktop_enabled', 'true') === 'true';
  const mobileEnabled = getSetting('ads_mobile_enabled', 'true') === 'true';
  
  const { data: adSpaces, isLoading } = useActiveAdSpaces(location, deviceType);

  // Function to execute scripts in the ad code
  const executeScripts = (element: HTMLElement) => {
    const scripts = element.querySelectorAll('script');
    scripts.forEach((script) => {
      const newScript = document.createElement('script');
      Array.from(script.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.appendChild(document.createTextNode(script.innerHTML));
      script.parentNode?.replaceChild(newScript, script);
    });
  };

  useEffect(() => {
    if (adSpaces && adSpaces.length > 0 && adContainerRef.current) {
      // Clear existing content
      adContainerRef.current.innerHTML = '';
      
      adSpaces.forEach((adSpace) => {
        if (adSpace.ad_code) {
          // Create container for this ad
          const adDiv = document.createElement('div');
          adDiv.className = 'ad-space-item mb-4';
          
          // Add "Advertisement" label
          const label = document.createElement('div');
          label.className = 'text-center text-xs text-muted-foreground mb-2';
          label.textContent = 'Advertisement';
          adDiv.appendChild(label);
          
          // Create content container
          const contentDiv = document.createElement('div');
          
          // Sanitize the ad code but allow scripts
          const sanitized = DOMPurify.sanitize(adSpace.ad_code, {
            ALLOWED_TAGS: ['script', 'ins', 'div', 'span', 'noscript'],
            ALLOWED_ATTR: ['class', 'style', 'data-ad-client', 'data-ad-slot', 'data-ad-format', 'data-full-width-responsive', 'async', 'crossorigin', 'src', 'type', 'id'],
            ALLOW_DATA_ATTR: true,
            ALLOW_UNKNOWN_PROTOCOLS: false,
            ADD_TAGS: ['script', 'ins'],
            ADD_ATTR: ['data-ad-client', 'data-ad-slot', 'data-ad-format', 'data-full-width-responsive']
          });
          
          contentDiv.innerHTML = sanitized;
          adDiv.appendChild(contentDiv);
          adContainerRef.current.appendChild(adDiv);
          
          // Execute scripts after DOM insertion
          executeScripts(contentDiv);
        }
      });
      
      // Initialize AdSense after all ads are inserted
      setTimeout(() => {
        try {
          if (window.adsbygoogle) {
            adSpaces.forEach(() => {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            });
          }
        } catch (error) {
          console.error('AdSense initialization error:', error);
        }
      }, 100);
    }
  }, [adSpaces]);

  // Don't show ads if advertising is disabled globally
  if (!advertisingEnabled) {
    return null;
  }

  // Don't show ads if device-specific setting is disabled
  if ((isMobile && !mobileEnabled) || (!isMobile && !desktopEnabled)) {
    return null;
  }

  if (isLoading || !adSpaces || adSpaces.length === 0) {
    return null;
  }

  return (
    <div 
      ref={adContainerRef}
      className={`dynamic-ad-space ${className}`}
    />
  );
};