import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getRedirectUrl } from '@/utils/urlRedirects';
import { migrateUrl } from '@/utils/urlMigration';
import { useUrlMigrationByOldUrl, useIncrementRedirectCount } from '@/hooks/useUrlMigrations';

export const RedirectHandler = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const incrementRedirectCount = useIncrementRedirectCount();

  // Check for old URL database lookup
  const shouldCheckDatabase = migrateUrl(location.pathname)?.startsWith('__OLD_URL_LOOKUP__');
  const oldUrlPath = shouldCheckDatabase ? location.pathname : '';
  
  const { data: urlMigration } = useUrlMigrationByOldUrl(oldUrlPath);

  useEffect(() => {
    console.log('🔄 RedirectHandler triggered for path:', location.pathname);
    const { categorySlug, subcategorySlug, topicSlug } = params;
    
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
    }
    
    // Check for URL migration patterns
    const migratedUrl = migrateUrl(location.pathname);
    if (migratedUrl && !migratedUrl.startsWith('__OLD_URL_LOOKUP__')) {
      navigate(migratedUrl, { replace: true });
      return;
    }
    
    // Check if we need to redirect the category slug
    if (categorySlug) {
      const newCategorySlug = getRedirectUrl(categorySlug);
      if (newCategorySlug) {
        // Build the new URL maintaining the same structure
        let newPath = `/${newCategorySlug}`;
        
        if (subcategorySlug) {
          const newSubcategorySlug = getRedirectUrl(subcategorySlug);
          newPath += `/${newSubcategorySlug || subcategorySlug}`;
          
          if (topicSlug) {
            newPath += `/${topicSlug}`;
          }
        } else if (topicSlug) {
          newPath += `/${topicSlug}`;
        }
        
        // Perform 301 redirect by replacing the current history entry
        navigate(newPath, { replace: true });
        return;
      }
    }
    
    // Check subcategory redirects
    if (subcategorySlug && !categorySlug) {
      const newSubcategorySlug = getRedirectUrl(subcategorySlug);
      if (newSubcategorySlug) {
        let newPath = `/${newSubcategorySlug}`;
        if (topicSlug) {
          newPath += `/${topicSlug}`;
        }
        navigate(newPath, { replace: true });
        return;
      }
    }
  }, [params, navigate, location.pathname]);

  return null;
};