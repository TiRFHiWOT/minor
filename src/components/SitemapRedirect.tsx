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
        
        // Construct the sitemap function URL with the type parameter and pass custom domain info
        const functionUrl = `https://rscowwmoeycyxmfslhme.supabase.co/functions/v1/sitemap?type=${type}`;
        
        // Fetch the sitemap directly with custom domain headers
        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/xml',
            'Origin': window.location.origin,
            'Referer': window.location.href,
            'X-Custom-Domain': window.location.host
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const xmlContent = await response.text();
        console.log('Fetched sitemap content, length:', xmlContent.length);
        
        if (!xmlContent || xmlContent.length === 0) {
          throw new Error('Empty sitemap response');
        }
        
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