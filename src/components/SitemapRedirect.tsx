import { useEffect } from 'react';

export const SitemapRedirect = () => {
  useEffect(() => {
    // Redirect to the actual sitemap URL
    window.location.href = 'https://rscowwmoeycyxmfslhme.supabase.co/functions/v1/sitemap';
  }, []);

  return null;
};