import { useEffect } from 'react';

export const SitemapRedirect = () => {
  useEffect(() => {
    // Redirect directly to the Supabase edge function URL
    const sitemapUrl = 'https://rscowwmoeycyxmfslhme.supabase.co/functions/v1/sitemap?type=index';
    window.location.replace(sitemapUrl);
  }, []);

  return null;
};