import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const RSSRedirect = () => {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');
    
    // Build the RSS feed URL
    const rssUrl = `https://rscowwmoeycyxmfslhme.supabase.co/functions/v1/rss-feed${
      category || limit ? '?' : ''
    }${category ? `category=${category}` : ''}${
      category && limit ? '&' : ''
    }${limit ? `limit=${limit}` : ''}`;
    
    // Redirect to the RSS feed
    window.location.href = rssUrl;
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to RSS feed...</p>
      </div>
    </div>
  );
};