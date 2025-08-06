import { useEffect } from 'react';

export const SitemapRedirect = () => {
  useEffect(() => {
    // Redirect to the actual sitemap endpoint
    window.location.href = '/functions/v1/sitemap-index';
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div>
        <p>Redirecting to sitemap...</p>
        <p>If you are not redirected automatically, <a href="/functions/v1/sitemap-index">click here</a>.</p>
      </div>
    </div>
  );
};