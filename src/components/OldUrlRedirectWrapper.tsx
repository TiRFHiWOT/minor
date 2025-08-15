import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isOldUrlPattern } from '@/utils/oldUrlPatterns';
import { migrateUrl } from '@/utils/urlMigration';
import { useUrlMigrationByOldUrl, useIncrementRedirectCount } from '@/hooks/useUrlMigrations';

interface OldUrlRedirectWrapperProps {
  children: React.ReactNode;
}

export const OldUrlRedirectWrapper = ({ children }: OldUrlRedirectWrapperProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const incrementRedirectCount = useIncrementRedirectCount();

  // Check for old URL database lookup
  const shouldCheckDatabase = migrateUrl(location.pathname)?.startsWith('__OLD_URL_LOOKUP__');
  const oldUrlPath = shouldCheckDatabase ? location.pathname : '';
  
  const { data: urlMigration } = useUrlMigrationByOldUrl(oldUrlPath);

  useEffect(() => {
    console.log('🔄 OldUrlRedirectWrapper checking path:', location.pathname);
    
    // First check if this is an old URL pattern
    if (isOldUrlPattern(location.pathname)) {
      console.log('🎯 Detected old URL pattern, checking for migration:', location.pathname);
      
      // Handle old URL database lookup first
      if (shouldCheckDatabase && urlMigration) {
        console.log('✅ Redirecting old URL:', oldUrlPath, '->', urlMigration.new_url);
        
        // Increment redirect count for analytics
        incrementRedirectCount.mutate(urlMigration.id);
        
        // Perform 301 redirect
        navigate(urlMigration.new_url, { replace: true });
        return;
      }
      
      // Log if we should check database but no migration found
      if (shouldCheckDatabase && !urlMigration) {
        console.log('⚠️ Should check database but no migration found for:', oldUrlPath);
        // Navigate to 404 or search page as fallback
        navigate('/search?q=' + encodeURIComponent(location.pathname.replace(/[-t\d\.html]/g, ' ')), { replace: true });
        return;
      }
      
      // Check for URL migration patterns (non-database)
      const migratedUrl = migrateUrl(location.pathname);
      if (migratedUrl && !migratedUrl.startsWith('__OLD_URL_LOOKUP__')) {
        console.log('🔄 Migrating URL:', location.pathname, '->', migratedUrl);
        navigate(migratedUrl, { replace: true });
        return;
      }
    }
  }, [location.pathname, urlMigration, shouldCheckDatabase, oldUrlPath, navigate, incrementRedirectCount]);

  // If this is an old URL pattern and we're still checking for migration, show loading
  if (isOldUrlPattern(location.pathname) && shouldCheckDatabase && !urlMigration) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>;
  }

  return <>{children}</>;
};