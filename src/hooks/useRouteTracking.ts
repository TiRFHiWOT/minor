import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGoogleAnalytics } from './useGoogleAnalytics';

// Declare the global AdMetrics function
declare global {
  interface Window {
    amp_refreshAllSlots?: () => void;
  }
}

export const useRouteTracking = () => {
  const location = useLocation();
  const { trackPageView, trackNavigation } = useGoogleAnalytics();
  const previousLocation = useRef(location.pathname);

  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = previousLocation.current;

    // Track navigation if path changed
    if (currentPath !== previousPath) {
      trackNavigation(previousPath, currentPath, 'click');
    }

    // Small delay to ensure MetadataProvider has set the title
    const timeoutId = setTimeout(() => {
      trackPageView(document.title);
    }, 100);

    // Refresh AdMetrics ads on route change for SPA navigation
    if (currentPath !== previousPath && typeof window.amp_refreshAllSlots === 'function') {
      // Add small delay to ensure page has loaded
      const adRefreshTimeout = setTimeout(() => {
        try {
          window.amp_refreshAllSlots();
          console.log('AdMetrics ads refreshed for route:', currentPath);
        } catch (error) {
          console.warn('AdMetrics refresh failed:', error);
        }
      }, 200);
      
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(adRefreshTimeout);
      };
    }

    // Update previous location
    previousLocation.current = currentPath;

    return () => clearTimeout(timeoutId);
  }, [location, trackPageView, trackNavigation]);

  return {
    currentPath: location.pathname,
    previousPath: previousLocation.current
  };
};