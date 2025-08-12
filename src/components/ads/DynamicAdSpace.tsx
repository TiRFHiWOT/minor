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
  
  // Helper: robust boolean from settings (accepts boolean, string, or number)
  const getBoolSetting = (key: string, fallback: boolean) => {
    const val = getSetting(key, fallback);
    return val === true || val === 'true' || val === 1 || val === '1';
  };
  
  // Check if advertising is enabled and device-specific settings
  const advertisingEnabled = getBoolSetting('advertising_enabled', true);
  const desktopEnabled = getBoolSetting('ads_desktop_enabled', true);
  const mobileEnabled = getBoolSetting('ads_mobile_enabled', true);
  
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

  // Ensure AdSense loader script exists (once)
  const ensureAdSenseScript = (clientId?: string) => {
    const existing = document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    ) as HTMLScriptElement | null;
    if (existing) return;

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = clientId
      ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
      : 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.setAttribute('data-custom-header', '');
    script.setAttribute('data-source', 'DynamicAdSpace');
    document.head.appendChild(script);
  };

  // Initialize AdSense slots inside a container (idempotent)
  const initAdSlotsWithin = (element: HTMLElement) => {
    if (!element) return;
    const insEls = element.querySelectorAll<HTMLModElement>('ins.adsbygoogle');
    if (!insEls || insEls.length === 0) return;

    // Use adtest if present (?adtest=1)
    const url = new URL(window.location.href);
    const adtestEnabled = url.searchParams.get('adtest') === '1' || url.searchParams.get('adtest') === 'on';

    // Try to get client id from first slot
    let clientId: string | undefined;
    insEls.forEach((el) => {
      const c = el.getAttribute('data-ad-client');
      if (!clientId && c) clientId = c;
    });

    ensureAdSenseScript(clientId);

    insEls.forEach((el, idx) => {
      try {
        if (adtestEnabled) {
          el.setAttribute('data-adtest', 'on');
        }
        // Avoid re-pushing on already initialized slots
        if (el.getAttribute('data-adsbygoogle-status')) return;
        if ((el as any)._adsbygoogle_initialized) return;

        (window.adsbygoogle = window.adsbygoogle || []).push({});
        (el as any)._adsbygoogle_initialized = true;
        // Basic debugging aid
        console.debug('[DynamicAdSpace] Initialized AdSense slot', { location, idx });
      } catch (e) {
        console.error('[DynamicAdSpace] AdSense slot init error', e);
      }
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
          adDiv.className = 'ad-space-item mb-4 flex flex-col items-center justify-center text-center';
          
          // Add "Advertisement" label
          const label = document.createElement('div');
          label.className = 'text-center text-xs text-muted-foreground mb-2';
          label.textContent = 'Advertisement';
          adDiv.appendChild(label);
          
          // Create content container
          const contentDiv = document.createElement('div');
          
          // Sanitize the ad code but allow scripts
          const sanitized = DOMPurify.sanitize(adSpace.ad_code, {
            ALLOWED_TAGS: ['script', 'ins', 'div', 'span', 'noscript', 'iframe'],
            ALLOWED_ATTR: [
              'class', 'style', 'id', 'type',
              // Common
              'src', 'async', 'crossorigin',
              // AdSense
              'data-ad-client', 'data-ad-slot', 'data-ad-format', 'data-full-width-responsive',
              // Iframe-related
              'width', 'height', 'frameborder', 'scrolling', 'marginwidth', 'marginheight', 'referrerpolicy', 'sandbox', 'allow', 'allowfullscreen', 'name'
            ],
            ALLOW_DATA_ATTR: true,
            ALLOW_UNKNOWN_PROTOCOLS: false,
            ADD_TAGS: ['script', 'ins', 'iframe'],
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
          if (adContainerRef.current) {
            initAdSlotsWithin(adContainerRef.current);
          }
        } catch (error) {
          console.error('[DynamicAdSpace] Ad initialization error:', error);
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