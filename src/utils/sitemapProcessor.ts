// Sitemap processing utilities for old URL migration
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface OldUrlPattern {
  fullUrl: string;
  path: string;
  filename: string;
  topicId?: number;
  postId?: number;
  categoryId?: number;
  type: 'topic' | 'post' | 'category' | 'other';
  title?: string;
  year?: string;
  level?: string;
  organization?: string;
  originalSlug?: string;
}

// Parse old URL patterns and extract identifiers
export const parseOldUrl = (url: string): OldUrlPattern | null => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const filename = path.split('/').pop() || '';
    
    // Topic pattern: ends with -t{number}.html
    const topicMatch = filename.match(/^(.+)-t(\d+)\.html$/);
    if (topicMatch) {
      const [, titlePart, topicId] = topicMatch;
      
      // Extract meaningful components from title
      const year = titlePart.match(/20\d{2}/)?.[0];
      const levelMatch = titlePart.match(/-a{1,3}(?![a-z])/i);
      const level = levelMatch ? levelMatch[0].replace('-', '').toUpperCase() : undefined;
      
      // Extract organization/league
      const organization = titlePart.includes('gthl') ? 'gthl' : 
                          titlePart.includes('ontario') ? 'ontario' :
                          titlePart.includes('alliance') ? 'alliance' :
                          titlePart.includes('minor-hockey') ? 'minor-hockey' :
                          undefined;
      
      return {
        fullUrl: url,
        path,
        filename,
        topicId: parseInt(topicId),
        type: 'topic',
        title: titlePart.replace(/-/g, ' '),
        year,
        level,
        organization,
        originalSlug: titlePart // Preserve the original slug format
      };
    }
    
    // Post pattern: ends with -p{number}.html or contains post ID
    const postMatch = filename.match(/^(.+)-p(\d+)\.html$/) || 
                     filename.match(/^(.+)-(\d+)\.html$/) ||
                     path.match(/\/post\/(\d+)/) ||
                     path.match(/\/posts\/(\d+)/);
    if (postMatch) {
      const [, titleOrPath, postId] = postMatch;
      return {
        fullUrl: url,
        path,
        filename,
        postId: parseInt(postId),
        type: 'post',
        title: typeof titleOrPath === 'string' ? titleOrPath.replace(/-/g, ' ') : undefined
      };
    }
    
    // Category patterns
    const categoryMatch = filename.match(/^(.+)-c(\d+)\.html$/) ||
                         path.match(/\/category\/(\d+)/) ||
                         path.match(/\/categories\/(\d+)/) ||
                         path.match(/\/forum\/(\d+)/);
    if (categoryMatch) {
      const [, titleOrPath, categoryId] = categoryMatch;
      return {
        fullUrl: url,
        path,
        filename,
        categoryId: parseInt(categoryId),
        type: 'category',
        title: typeof titleOrPath === 'string' ? titleOrPath.replace(/-/g, ' ') : undefined
      };
    }
    
    // Other patterns
    return {
      fullUrl: url,
      path,
      filename,
      type: 'other'
    };
  } catch (error) {
    console.error('Error parsing old URL:', url, error);
    return null;
  }
};

// Fetch and parse XML sitemap
export const fetchSitemap = async (sitemapUrl: string): Promise<SitemapUrl[]> => {
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`);
    }
    
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Failed to parse XML sitemap');
    }
    
    const urls: SitemapUrl[] = [];
    
    // Handle sitemap index (contains references to other sitemaps)
    const sitemapElements = xmlDoc.querySelectorAll('sitemap');
    if (sitemapElements.length > 0) {
      for (const sitemap of sitemapElements) {
        const loc = sitemap.querySelector('loc')?.textContent;
        if (loc) {
          // Recursively fetch child sitemaps
          const childUrls = await fetchSitemap(loc);
          urls.push(...childUrls);
        }
      }
    } else {
      // Handle regular sitemap (contains URLs)
      const urlElements = xmlDoc.querySelectorAll('url');
      for (const urlElement of urlElements) {
        const loc = urlElement.querySelector('loc')?.textContent;
        if (loc) {
          urls.push({
            loc,
            lastmod: urlElement.querySelector('lastmod')?.textContent || undefined,
            changefreq: urlElement.querySelector('changefreq')?.textContent || undefined,
            priority: urlElement.querySelector('priority')?.textContent || undefined
          });
        }
      }
    }
    
    return urls;
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    throw error;
  }
};

// Process sitemap URLs and extract old URL patterns
export const processSitemapUrls = (urls: SitemapUrl[]): OldUrlPattern[] => {
  const patterns: OldUrlPattern[] = [];
  
  for (const url of urls) {
    const pattern = parseOldUrl(url.loc);
    if (pattern) {
      patterns.push(pattern);
    }
  }
  
  // Sort by type and ID for better organization
  return patterns.sort((a, b) => {
    if (a.type !== b.type) {
      const typeOrder = { topic: 1, post: 2, category: 3, other: 4 };
      return typeOrder[a.type] - typeOrder[b.type];
    }
    
    if (a.topicId && b.topicId) return a.topicId - b.topicId;
    if (a.postId && b.postId) return a.postId - b.postId;
    if (a.categoryId && b.categoryId) return a.categoryId - b.categoryId;
    
    return a.fullUrl.localeCompare(b.fullUrl);
  });
};

// Generate potential new URLs based on old patterns - PRESERVING ORIGINAL STRUCTURE
export const generatePotentialNewUrl = (pattern: OldUrlPattern): string[] => {
  const potentialUrls: string[] = [];
  
  if (pattern.type === 'topic' && pattern.originalSlug && pattern.topicId) {
    // Create topic slug that preserves original meaningful parts + topic ID
    const topicSlug = `${pattern.originalSlug}-t${pattern.topicId}`;
    
    // Build hierarchical category structure based on extracted components
    if (pattern.year && pattern.level && pattern.organization) {
      // For organization-year-level structure: /ontario-2015-aaa/alliance-2015-aaa-t6066
      const categorySlug = `${pattern.organization}-${pattern.year}-${pattern.level.toLowerCase()}`;
      potentialUrls.push(`/${categorySlug}/${topicSlug}`);
      
      // Also try with parent category structure
      if (pattern.organization !== 'ontario') {
        potentialUrls.push(`/ontario-${pattern.year}-${pattern.level.toLowerCase()}/${topicSlug}`);
      }
    } else if (pattern.year && pattern.level) {
      // Fallback: /year-level/original-slug-t6066
      const categorySlug = `${pattern.year}-${pattern.level.toLowerCase()}`;
      potentialUrls.push(`/${categorySlug}/${topicSlug}`);
    } else {
      // Last resort: preserve as much as possible
      potentialUrls.push(`/topic/${topicSlug}`);
    }
  }
  
  return potentialUrls;
};
