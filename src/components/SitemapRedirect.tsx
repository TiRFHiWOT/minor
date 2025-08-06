import { useEffect } from 'react';

export const SitemapRedirect = () => {
  useEffect(() => {
    // Use relative URL to work with any domain (custom or Supabase)
    window.location.replace('/sitemap.xml?type=index');
  }, []);

  // Return null since we're redirecting immediately
  return null;
};