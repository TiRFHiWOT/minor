import { getRedirectUrl } from './urlRedirects';
import { parseOldUrl } from './sitemapProcessor';

// Migration utility to handle URL structure changes
export const migrateUrl = (path: string): string | null => {
  console.log('🚀 migrateUrl called with path:', path);
  console.log('🌐 Current URL:', typeof window !== 'undefined' ? window.location.href : 'Server side');
  
  const { isOldUrlPattern, getCleanPath } = require('@/utils/oldUrlPatterns');
  const cleanPath = getCleanPath(path);
  
  if (isOldUrlPattern(cleanPath)) {
    console.log('🎯 Old URL pattern detected:', cleanPath);
    // Return special marker to indicate database lookup needed
    return '__OLD_URL_LOOKUP__';
  }
  const segments = cleanPath.split('/');
  
  // Check for old forum URL patterns first (e.g., "2011-aa-gthl-east-t5448.html")
  const fullPath = path.endsWith('/') ? path.slice(0, -1) : path;
  console.log('🔗 Checking fullPath for old pattern:', fullPath);
  
  const oldPattern = parseOldUrl(`https://example.com${fullPath}`);
  console.log('📋 parseOldUrl result:', oldPattern);
  
  if (oldPattern && (oldPattern.type === 'topic' || oldPattern.type === 'post')) {
    // This is an old forum URL that needs database lookup
    // Return a special marker to indicate database lookup is needed
    const result = `__OLD_URL_LOOKUP__${fullPath}`;
    console.log('✅ Returning database lookup marker:', result);
    return result;
  }
  
  // Handle flat Level 3 category URLs that need to become hierarchical
  if (segments.length === 1) {
    const categorySlug = segments[0];
    
    // Check if this is a redirectable category (from urlRedirects)
    const newSlug = getRedirectUrl(categorySlug);
    if (newSlug) {
      // This was already handled by the redirect system
      return null;
    }
    
    // Check if this looks like a Level 3 category (contains region/year patterns)
    if (categorySlug.includes('-201') || categorySlug.includes('-200') || 
        categorySlug.match(/-aaa$/i) || categorySlug.match(/-aa$/i) || 
        categorySlug.match(/-a$/i) || categorySlug.match(/-rep$/i)) {
      
      // This might be a Level 3 category that should be hierarchical
      // For now, we'll let the existing redirect system handle this
      // In the future, we could add more sophisticated migration logic here
      return null;
    }
  }
  
  // No migration needed
  return null;
};

export const shouldMigrateUrl = (path: string): boolean => {
  return migrateUrl(path) !== null;
};