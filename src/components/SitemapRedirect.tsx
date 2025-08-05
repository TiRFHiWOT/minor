import { useEffect } from 'react';

export const SitemapRedirect = () => {
  useEffect(() => {
    const fetchAndServeSitemap = async () => {
      try {
        // Get the type parameter from the current URL
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type') || 'index';
        
        console.log('Fetching sitemap type:', type);
        
        // Construct the sitemap function URL with the type parameter
        const functionUrl = `https://rscowwmoeycyxmfslhme.supabase.co/functions/v1/sitemap?type=${type}`;
        
        // Fetch the sitemap directly
        const response = await fetch(functionUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/xml',
          },
        });

        if (!response.ok) {
          console.error('Error fetching sitemap:', response.statusText);
          return;
        }

        const xmlContent = await response.text();
        console.log('Fetched sitemap content, length:', xmlContent.length);
        
        // Replace the current page content with the sitemap XML
        document.open();
        document.write(xmlContent);
        document.close();
        
      } catch (error) {
        console.error('Error in sitemap fetch:', error);
      }
    };

    fetchAndServeSitemap();
  }, []);

  return <div>Loading sitemap...</div>;
};