import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

interface EnhancedMigration {
  old_url: string;
  new_url: string;
  url_type: 'topic' | 'post' | 'category' | 'other';
  old_topic_id?: number;
  old_post_id?: number;
  old_category_id?: number;
  new_topic_id?: string;
  new_category_id?: string;
  priority: number;
  status: 'pending' | 'active' | 'disabled';
  notes?: string;
  match_confidence?: number;
  match_type?: 'exact' | 'title_similarity' | 'legacy_id' | 'generated';
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

// Generate SEO-friendly slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Calculate title similarity using simple string comparison
const calculateSimilarity = (str1: string, str2: string): number => {
  const a = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const b = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (a === b) return 1.0;
  
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  
  return matches / longer.length;
};

// Find appropriate category based on title keywords
const findAppropriateCategory = (title: string, categories: any[]): any | null => {
  const titleLower = title.toLowerCase();
  
  // Define keyword mappings for categories
  const categoryKeywords = [
    { keywords: ['gthl', 'greater toronto', 'toronto'], categorySlug: 'gthl' },
    { keywords: ['aaa', 'triple a'], categorySlug: 'aaa' },
    { keywords: ['aa', 'double a'], categorySlug: 'aa' },
    { keywords: ['rep', 'representative'], categorySlug: 'rep' },
    { keywords: ['house league', 'house'], categorySlug: 'house-league' },
    { keywords: ['junior', 'ohl', 'chl'], categorySlug: 'junior-hockey' },
    { keywords: ['ontario', 'omha'], categorySlug: 'ontario' },
    { keywords: ['equipment', 'gear'], categorySlug: 'equipment' },
    { keywords: ['coaching', 'coach'], categorySlug: 'coaching' },
    { keywords: ['referee', 'official'], categorySlug: 'officials' }
  ];
  
  for (const mapping of categoryKeywords) {
    for (const keyword of mapping.keywords) {
      if (titleLower.includes(keyword)) {
        const category = categories.find(c => c.slug === mapping.categorySlug);
        if (category) return category;
      }
    }
  }
  
  return null;
};

// Generate a single migration for a pattern
const generateMigrationForPattern = async (
  pattern: OldUrlPattern,
  topics: any[],
  categories: any[]
): Promise<EnhancedMigration | null> => {
  
  if (pattern.type === 'topic' && pattern.topicId) {
    // Try to find matching topic by legacy_topic_id first
    let matchedTopic = topics.find(t => t.legacy_topic_id === pattern.topicId);
    let matchType: 'exact' | 'title_similarity' | 'legacy_id' | 'generated' = 'legacy_id';
    let confidence = 1.0;
    
    // If no legacy match, try title similarity
    if (!matchedTopic && pattern.title) {
      let bestMatch = null;
      let bestSimilarity = 0;
      
      for (const topic of topics) {
        const similarity = calculateSimilarity(pattern.title, topic.title);
        if (similarity > bestSimilarity && similarity > 0.7) { // 70% similarity threshold
          bestSimilarity = similarity;
          bestMatch = topic;
        }
      }
      
      if (bestMatch) {
        matchedTopic = bestMatch;
        matchType = 'title_similarity';
        confidence = bestSimilarity;
      }
    }
    
    let newUrl: string;
    let newTopicId: string | undefined;
    
    if (matchedTopic) {
      // Generate proper hierarchical URL for matched topic
      newTopicId = matchedTopic.id;
      const category = matchedTopic.categories;
      
      if (category.parent_category_id && category.parent_category) {
        // Level 3 category: /parent-slug/category-slug/topic-slug
        newUrl = `/${category.parent_category.slug}/${category.slug}/${matchedTopic.slug}`;
      } else {
        // Level 2 category: /category-slug/topic-slug
        newUrl = `/${category.slug}/${matchedTopic.slug}`;
      }
    } else {
      // Generate new URL based on title and best-guess category
      matchType = 'generated';
      confidence = 0.5;
      
      if (pattern.title) {
        const slug = generateSlug(pattern.title);
        // Try to find appropriate category based on title keywords
        const appropriateCategory = findAppropriateCategory(pattern.title, categories);
        
        if (appropriateCategory) {
          if (appropriateCategory.parent_category_id && appropriateCategory.parent_category) {
            newUrl = `/${appropriateCategory.parent_category.slug}/${appropriateCategory.slug}/${slug}`;
          } else {
            newUrl = `/${appropriateCategory.slug}/${slug}`;
          }
        } else {
          // Fallback to general discussion
          newUrl = `/general-youth-hockey-discussion/${slug}`;
        }
      } else {
        // Last resort: create a proper slug from the URL or ID
        const cleanTitle = pattern.title || `Topic ${pattern.topicId}`;
        const slug = generateSlug(cleanTitle);
        newUrl = `/general-youth-hockey-discussion/${slug}`;
        confidence = 0.1;
      }
    }
    
    return {
      old_url: pattern.path,
      new_url: newUrl,
      url_type: 'topic',
      old_topic_id: pattern.topicId,
      new_topic_id: newTopicId,
      priority: confidence > 0.8 ? 1 : confidence > 0.5 ? 2 : 3,
      status: confidence > 0.7 ? 'active' : 'pending',
      notes: `${matchType} match (${Math.round(confidence * 100)}% confidence). Original title: ${pattern.title || 'Unknown'}`,
      match_confidence: confidence,
      match_type: matchType
    };
  }
  
  // Handle category patterns
  if (pattern.type === 'category' && pattern.categoryId) {
    // For now, redirect to general category list
    return {
      old_url: pattern.path,
      new_url: '/categories',
      url_type: 'category',
      old_category_id: pattern.categoryId,
      priority: 2,
      status: 'pending',
      notes: `Category redirect. Original: ${pattern.title || 'Unknown'}`,
      match_confidence: 0.5,
      match_type: 'generated'
    };
  }
  
  return null;
};

// Generate enhanced migrations with database lookups
const generateEnhancedMigrations = async (
  supabase: any,
  patterns: OldUrlPattern[],
  batchSize: number = 500
): Promise<EnhancedMigration[]> => {
  const migrations: EnhancedMigration[] = [];
  
  // Get all current topics and categories for matching
  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select(`
      id,
      title,
      slug,
      legacy_topic_id,
      categories!inner (
        id,
        name,
        slug,
        parent_category_id,
        parent_category:categories (
          slug
        )
      )
    `);
    
  if (topicsError) {
    console.error('Error fetching topics:', topicsError);
    throw new Error('Failed to fetch topics for matching');
  }
  
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      parent_category_id,
      parent_category:categories (
        slug
      )
    `);
    
  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    throw new Error('Failed to fetch categories for matching');
  }
  
  console.log(`Found ${topics?.length || 0} topics and ${categories?.length || 0} categories for matching`);
  
  // Process patterns in batches to avoid timeouts
  for (let i = 0; i < patterns.length; i += batchSize) {
    const batch = patterns.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(patterns.length / batchSize)}`);
    
    for (const pattern of batch) {
      try {
        const migration = await generateMigrationForPattern(pattern, topics, categories);
        if (migration) {
          migrations.push(migration);
        }
      } catch (error) {
        console.error(`Error generating migration for pattern ${pattern.path}:`, error);
      }
    }
  }
  
  return migrations;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request body:', JSON.stringify(req.body, null, 2));
    const { sitemapUrl, generateMigrations = false, batchSize = 500 } = await req.json();
    
    if (!sitemapUrl) {
      throw new Error('Sitemap URL is required');
    }

    console.log('Processing sitemap:', sitemapUrl);
    const urls = await fetchSitemap(sitemapUrl);
    const patterns = processSitemapUrls(urls);
    
    // Create summary statistics
    const summary = {
      total: patterns.length,
      topics: patterns.filter(p => p.type === 'topic').length,
      posts: patterns.filter(p => p.type === 'post').length,
      categories: patterns.filter(p => p.type === 'category').length,
      other: patterns.filter(p => p.type === 'other').length,
    };

    console.log('Processing complete. Summary:', summary);

    let migrations: EnhancedMigration[] = [];
    
    if (generateMigrations) {
      console.log('Generating enhanced migrations...');
      
      // Initialize Supabase client for database lookups
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      migrations = await generateEnhancedMigrations(supabase, patterns, batchSize);
      
      console.log(`Generated ${migrations.length} enhanced migrations`);
    }

    return new Response(JSON.stringify({
      success: true,
      patterns,
      migrations,
      summary,
      total: urls.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-sitemap function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
