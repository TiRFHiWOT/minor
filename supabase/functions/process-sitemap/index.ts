import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface OldUrlPattern {
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
const parseOldUrl = (url: string): OldUrlPattern | null => {
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

// Simple XML parser for sitemap processing
const parseXmlSitemap = (xmlText: string): SitemapUrl[] => {
  const urls: SitemapUrl[] = [];
  
  try {
    // Extract URLs using regex patterns
    const urlMatches = xmlText.matchAll(/<url[^>]*>(.*?)<\/url>/gs);
    
    for (const match of urlMatches) {
      const urlBlock = match[1];
      
      // Extract location
      const locMatch = urlBlock.match(/<loc[^>]*>(.*?)<\/loc>/s);
      if (locMatch) {
        const url: SitemapUrl = {
          loc: locMatch[1].trim()
        };
        
        // Extract optional fields
        const lastmodMatch = urlBlock.match(/<lastmod[^>]*>(.*?)<\/lastmod>/s);
        if (lastmodMatch) {
          url.lastmod = lastmodMatch[1].trim();
        }
        
        const changefreqMatch = urlBlock.match(/<changefreq[^>]*>(.*?)<\/changefreq>/s);
        if (changefreqMatch) {
          url.changefreq = changefreqMatch[1].trim();
        }
        
        const priorityMatch = urlBlock.match(/<priority[^>]*>(.*?)<\/priority>/s);
        if (priorityMatch) {
          url.priority = priorityMatch[1].trim();
        }
        
        urls.push(url);
      }
    }
    
    return urls;
  } catch (error) {
    console.error('Error parsing XML:', error);
    return [];
  }
};

// Fetch and parse XML sitemap using regex-based parsing
const fetchSitemap = async (sitemapUrl: string): Promise<SitemapUrl[]> => {
  try {
    console.log('Fetching sitemap:', sitemapUrl);
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    console.log('Sitemap fetched, length:', xmlText.length);
    
    const urls: SitemapUrl[] = [];
    
    // Check if this is a sitemap index (contains references to other sitemaps)
    const sitemapMatches = xmlText.matchAll(/<sitemap[^>]*>(.*?)<\/sitemap>/gs);
    const sitemapIndexUrls = Array.from(sitemapMatches);
    
    if (sitemapIndexUrls.length > 0) {
      console.log('Found sitemap index with', sitemapIndexUrls.length, 'child sitemaps');
      for (const match of sitemapIndexUrls) {
        const sitemapBlock = match[1];
        const locMatch = sitemapBlock.match(/<loc[^>]*>(.*?)<\/loc>/s);
        if (locMatch) {
          const childSitemapUrl = locMatch[1].trim();
          try {
            const childUrls = await fetchSitemap(childSitemapUrl);
            urls.push(...childUrls);
          } catch (error) {
            console.error('Error fetching child sitemap:', childSitemapUrl, error);
          }
        }
      }
    } else {
      // Handle regular sitemap (contains URLs)
      const parsedUrls = parseXmlSitemap(xmlText);
      console.log('Found', parsedUrls.length, 'URLs in sitemap');
      urls.push(...parsedUrls);
    }
    
    console.log('Total URLs extracted:', urls.length);
    return urls;
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    throw error;
  }
};

// Process sitemap URLs and extract old URL patterns
const processSitemapUrls = (urls: SitemapUrl[]): OldUrlPattern[] => {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sitemapUrl } = await req.json();
    
    if (!sitemapUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing sitemapUrl parameter' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing sitemap:', sitemapUrl);
    
    // Fetch and parse the sitemap
    const urls = await fetchSitemap(sitemapUrl);
    
    // Process URLs to extract patterns
    const patterns = processSitemapUrls(urls);
    
    // Group patterns by type for summary
    const summary = {
      total: patterns.length,
      topics: patterns.filter(p => p.type === 'topic').length,
      posts: patterns.filter(p => p.type === 'post').length,
      categories: patterns.filter(p => p.type === 'category').length,
      other: patterns.filter(p => p.type === 'other').length
    };

    console.log('Processing complete:', summary);

    return new Response(
      JSON.stringify({ 
        success: true,
        patterns,
        summary,
        totalUrls: urls.length
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-sitemap function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
