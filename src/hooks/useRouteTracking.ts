import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useGoogleAnalytics } from './useGoogleAnalytics';


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


    // Update previous location
    previousLocation.current = currentPath;

    return () => clearTimeout(timeoutId);
  }, [location, trackPageView, trackNavigation]);

  return {
    currentPath: location.pathname,
    previousPath: previousLocation.current
  };
};