import { useEffect } from 'react';

export const SitemapRedirect = () => {
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
          console.error('Error fetching sitemap:', response.statusText);
          return;
        }

        const xmlContent = await response.text();
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
        
        // Note: Content type is handled by the edge function response
        
      } catch (error) {
        console.error('Error in sitemap fetch:', error);
        // Show a basic error message
        document.open();
        document.write('<?xml version="1.0" encoding="UTF-8"?><error>Failed to load sitemap</error>');
        document.close();
      }
    };

    fetchAndServeSitemap();
  }, []);

  return <div>Loading sitemap...</div>;
};