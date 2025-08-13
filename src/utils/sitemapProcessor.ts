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
      const [, title, topicId] = topicMatch;
      return {
        fullUrl: url,
        path,
        filename,
        topicId: parseInt(topicId),
        type: 'topic',
        title: title.replace(/-/g, ' ')
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

// Generate potential new URLs based on old patterns
export const generatePotentialNewUrl = (pattern: OldUrlPattern): string[] => {
  const potentialUrls: string[] = [];
  
  if (pattern.type === 'topic' && pattern.title) {
    // Generate slug from title
    const slug = pattern.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    // Try different category structures
    potentialUrls.push(`/topic/${slug}`);
    potentialUrls.push(`/general-youth-hockey-discussion/${slug}`);
    potentialUrls.push(`/ontario-youth-hockey-forum/${slug}`);
  }
  
  return potentialUrls;
};
