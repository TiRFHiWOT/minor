import { useEffect, useState } from 'react';

export const SitemapRedirect = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndServeSitemap = async () => {
      try {
        // Get the type parameter from the current URL
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type') || 'index';
        
        console.log('Fetching sitemap type:', type);
        
        // Use Supabase client to call the sitemap function
        const { supabase } = await import('@/integrations/supabase/client');
        
        const { data, error } = await supabase.functions.invoke('sitemap', {
          body: { 
            type,
            custom_domain: window.location.host,
            origin: window.location.origin
          }
        });

        if (error) {
          throw new Error(`Supabase function error: ${error.message}`);
        }

        if (!data) {
          throw new Error('Empty sitemap response');
        }

        const xmlContent = typeof data === 'string' ? data : JSON.stringify(data);
        console.log('Fetched sitemap content, length:', xmlContent.length);
        
        // Replace any remaining Supabase URLs with custom domain
        const correctedXml = xmlContent.replace(
          /https:\/\/rscowwmoeycyxmfslhme\.supabase\.co/g, 
          window.location.origin
        );
        
        // Replace the current page content with the sitemap XML
        document.open();
        document.write(correctedXml);
        document.close();
        
        setLoading(false);
        
      } catch (error) {
        console.error('Error in sitemap fetch:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
        
        // Show a basic error message in XML format
        document.open();
        document.write(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Error loading sitemap: ${error instanceof Error ? error.message : 'Unknown error'} -->
</urlset>`);
        document.close();
      }
    };

    fetchAndServeSitemap();
  }, []);

  if (error) {
    return <div>Error loading sitemap: {error}</div>;
  }

  if (loading) {
    return <div>Loading sitemap...</div>;
  }

  return null;
};