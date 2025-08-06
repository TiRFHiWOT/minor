import { useEffect } from 'react';

export const SitemapRedirect = () => {
  useEffect(() => {
    // Use current domain (custom or Supabase) to build the sitemap URL
    const sitemapUrl = `${window.location.origin}/functions/v1/sitemap?type=index`;
    window.location.replace(sitemapUrl);
  }, []);

  return null;
};