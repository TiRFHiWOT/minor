import { useEffect } from 'react';

export const SitemapRedirect = () => {
  useEffect(() => {
    // Immediately redirect to the edge function
    window.location.replace('https://rscowwmoeycyxmfslhme.supabase.co/functions/v1/sitemap?type=index');
  }, []);

  // Return null since we're redirecting immediately
  return null;
};