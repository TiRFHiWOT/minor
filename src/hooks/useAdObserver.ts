import { useEffect, useRef } from 'react';

interface AdObserverOptions {
  onAdLoaded?: (element: HTMLElement, size: { width: number; height: number }) => void;
  onAdEmpty?: (element: HTMLElement) => void;
  hideEmptySlots?: boolean;
}

export const useAdObserver = (adId: string, options: AdObserverOptions = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { onAdLoaded, onAdEmpty, hideEmptySlots = true } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        const { width, height } = entry.contentRect;
        
        // Check if the ad has actual content
        const hasContent = element.children.length > 0 || element.textContent?.trim();
        
        if (hasContent && height > 0) {
          // Ad has loaded with content
          element.style.display = 'block';
          element.style.minHeight = `${height}px`;
          onAdLoaded?.(element, { width, height });
        } else if (hideEmptySlots) {
          // Ad is empty, hide container
          element.style.display = 'none';
          onAdEmpty?.(element);
        }
      });
    });

    // Observe the ad container
    const adElement = container.querySelector(`#${adId}`) as HTMLElement;
    if (adElement) {
      resizeObserver.observe(adElement);
    }

    // GPT event listeners for more precise ad state detection
    const handleSlotRenderEnded = (event: any) => {
      if (event.slot?.getSlotElementId() === adId) {
        const element = document.getElementById(adId);
        if (!element) return;

        if (event.isEmpty || !event.size) {
          // Ad slot is empty
          if (hideEmptySlots) {
            element.style.display = 'none';
          }
          onAdEmpty?.(element);
        } else {
          // Ad has loaded
          element.style.display = 'block';
          element.style.minHeight = `${event.size[1]}px`;
          onAdLoaded?.(element, { width: event.size[0], height: event.size[1] });
        }
      }
    };

    // Listen for GPT events if googletag is available
    if (window.googletag && window.googletag.pubads) {
      window.googletag.pubads().addEventListener('slotRenderEnded', handleSlotRenderEnded);
    }

    return () => {
      resizeObserver.disconnect();
      if (window.googletag && window.googletag.pubads) {
        window.googletag.pubads().removeEventListener('slotRenderEnded', handleSlotRenderEnded);
      }
    };
  }, [adId, onAdLoaded, onAdEmpty, hideEmptySlots]);

  return { containerRef };
};

// Extend Window interface for googletag
declare global {
  interface Window {
    googletag?: {
      pubads: () => {
        addEventListener: (event: string, callback: (event: any) => void) => void;
        removeEventListener: (event: string, callback: (event: any) => void) => void;
      };
    };
  }
}