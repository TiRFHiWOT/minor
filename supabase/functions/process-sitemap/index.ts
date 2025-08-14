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

// Enhanced URL pattern interface with preservation info
interface EnhancedOldUrlPattern extends OldUrlPattern {
  year?: string;
  level?: string;
  organization?: string;
  originalSlug?: string;
  extractedInfo?: {
    preservedTopicId?: string;
    hasYear?: boolean;
    hasLevel?: boolean;
    hasOrganization?: boolean;
  };
}

// Enhanced URL parsing with preservation logic
const parseOldUrl = (url: string): EnhancedOldUrlPattern | null => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const filename = path.split('/').pop() || '';
    
    // Enhanced topic pattern: ends with -t{number}.html
    const topicMatch = filename.match(/^(.+)-t(\d+)\.html$/);
    if (topicMatch) {
      const [, titlePart, topicId] = topicMatch;
      
      // Extract meaningful components from filename
      const year = titlePart.match(/(20\d{2})/)?.[1];
      const levelMatch = titlePart.match(/-a{1,3}(?![a-z])/i);
      const level = levelMatch ? levelMatch[0].replace('-', '').toLowerCase() : undefined;
      
      // Extract organization
      const organization = titlePart.includes('gthl') ? 'gthl' :
                          titlePart.includes('alliance') ? 'alliance' :
                          titlePart.includes('ontario') ? 'ontario' : undefined;
      
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
        originalSlug: titlePart,
        extractedInfo: {
          preservedTopicId: `t${topicId}`,
          hasYear: !!year,
          hasLevel: !!level,
          hasOrganization: !!organization
        }
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

// Optimized similarity calculation with early exits
const calculateSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1.0;
  
  const a = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const b = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (a === b) return 1.0;
  
  // Quick length check - if lengths differ too much, similarity is low
  const lengthDiff = Math.abs(a.length - b.length);
  if (lengthDiff > Math.max(a.length, b.length) * 0.5) return 0;
  
  // Simple character overlap check first
  const overlap = getCharacterOverlap(a, b);
  if (overlap < 0.3) return 0; // Early exit if no significant overlap
  
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  // Only do expensive calculation if there's promise
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  
  return matches / longer.length;
};

const getCharacterOverlap = (str1: string, str2: string): number => {
  const chars1 = new Set(str1);
  const chars2 = new Set(str2);
  const intersection = new Set([...chars1].filter(x => chars2.has(x)));
  return intersection.size / Math.max(chars1.size, chars2.size);
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

// Optimized function to pre-compute lookup maps
const buildLookupMaps = (topics: any[], categories: any[]) => {
  const topicTitleMap = new Map<string, any[]>();
  const categoryNameMap = new Map<string, any[]>();
  
  // Build topic title word map for faster lookups
  for (const topic of topics) {
    if (topic.title) {
      const words = topic.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      for (const word of words.slice(0, 5)) { // Limit words to process
        if (!topicTitleMap.has(word)) {
          topicTitleMap.set(word, []);
        }
        topicTitleMap.get(word)!.push(topic);
      }
    }
  }
  
  // Build category name word map
  for (const category of categories) {
    if (category.name) {
      const words = category.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      for (const word of words) {
        if (!categoryNameMap.has(word)) {
          categoryNameMap.set(word, []);
        }
        categoryNameMap.get(word)!.push(category);
      }
    }
  }
  
  return { topicTitleMap, categoryNameMap };
};

// Enhanced URL reconstruction that preserves original structure
const reconstructUrlPreservingOriginal = (
  pattern: EnhancedOldUrlPattern, 
  matchedTopic: any, 
  category: any
): string => {
  const { year, level, organization, originalSlug, extractedInfo } = pattern;
  
  // Build hierarchical category path with preserved information
  let categoryPath = '';
  
  if (category?.parent_category_id && category?.parent_category?.slug) {
    // Level 3 category: /parent-slug/subcategory-slug
    categoryPath = `/${category.parent_category.slug}/${category.slug}`;
  } else if (category?.slug) {
    // Level 2 category: /category-slug  
    categoryPath = `/${category.slug}`;
  } else {
    // Fallback category
    categoryPath = '/general-youth-hockey-discussion';
  }
  
  // Build topic slug preserving original meaningful parts
  let topicSlug = matchedTopic.slug;
  
  // If we have preserved info, enhance the slug
  if (extractedInfo?.preservedTopicId && originalSlug) {
    // Try to preserve original naming pattern with topic ID
    const baseName = originalSlug.replace(/-t\d+$/, ''); // Remove old topic ID
    topicSlug = `${baseName}-${extractedInfo.preservedTopicId}`;
  }
  
  return `${categoryPath}/${topicSlug}`;
};

// Generate new URL using preservation logic for unmatched topics
const generatePreservedUrl = (pattern: EnhancedOldUrlPattern, categories: any[]): string => {
  const { year, level, organization, originalSlug, extractedInfo } = pattern;
  
  // Build category path based on extracted information
  let categoryPath = '';
  
  if (year && level && organization) {
    // Try to find or construct hierarchical category
    const parentSlug = organization === 'gthl' ? 'gthl' : 'ontario';
    const subSlug = `${organization}-${year}-${level}`;
    categoryPath = `/${parentSlug}/${subSlug}`;
  } else if (year && level) {
    // Default to ontario if no organization
    categoryPath = `/ontario/ontario-${year}-${level}`;
  } else {
    // Fallback to general category
    categoryPath = '/general-youth-hockey-discussion';
  }
  
  // Build topic slug preserving as much original info as possible
  let topicSlug = '';
  if (originalSlug && extractedInfo?.preservedTopicId) {
    topicSlug = `${originalSlug}`;
  } else if (pattern.title) {
    topicSlug = generateSlug(pattern.title);
    if (extractedInfo?.preservedTopicId) {
      topicSlug = `${topicSlug}-${extractedInfo.preservedTopicId}`;
    }
  } else {
    topicSlug = `topic-${extractedInfo?.preservedTopicId || 'unknown'}`;
  }
  
  return `${categoryPath}/${topicSlug}`;
};

// Optimized function to generate migration for a single URL pattern
const generateMigrationForPattern = async (
  pattern: OldUrlPattern,
  topics: any[],
  categories: any[],
  topicTitleMap?: Map<string, any[]>,
  categoryNameMap?: Map<string, any[]>
): Promise<EnhancedMigration | null> => {
  
  if (pattern.type === 'topic' && pattern.topicId) {
    // Fast path: exact legacy ID match
    let matchedTopic = topics.find(t => t.legacy_topic_id === pattern.topicId);
    let matchType: 'exact' | 'title_similarity' | 'legacy_id' | 'generated' = 'legacy_id';
    let confidence = 1.0;
    
    // Optimized title similarity matching using pre-computed map
    if (!matchedTopic && pattern.title && topicTitleMap) {
      const titleWords = pattern.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const candidates = new Set<any>();
      
      // Collect candidates that share keywords
      for (const word of titleWords.slice(0, 3)) { // Limit to first 3 significant words
        const matches = topicTitleMap.get(word) || [];
        matches.forEach(topic => candidates.add(topic));
      }
      
      let bestMatch = null;
      let bestSimilarity = 0;
      let comparisons = 0;
      
      // Only compare against relevant candidates
      for (const topic of candidates) {
        if (++comparisons > 30) break; // Limit comparisons to prevent timeout
        
        const similarity = calculateSimilarity(pattern.title, topic.title);
        
        if (similarity > 0.85) { // Higher threshold for confidence
          bestSimilarity = similarity;
          bestMatch = topic;
          break; // Early exit on high confidence match
        } else if (similarity > bestSimilarity && similarity > 0.7) {
          bestSimilarity = similarity;
          bestMatch = topic;
        }
      }
      
      if (bestMatch) {
        matchedTopic = bestMatch;
        matchType = 'title_similarity';
        confidence = bestSimilarity;
      }
    } else if (!matchedTopic && pattern.title && !topicTitleMap) {
      // Fallback to simple search if no lookup map
      let bestMatch = null;
      let bestSimilarity = 0;
      let comparisons = 0;
      
      for (const topic of topics) {
        if (++comparisons > 50) break; // Strict limit
        const similarity = calculateSimilarity(pattern.title, topic.title);
        if (similarity > bestSimilarity && similarity > 0.7) {
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
    
    // Enhanced URL reconstruction with preservation logic
    const enhancedPattern = pattern as EnhancedOldUrlPattern;
    let newUrl: string;
    let newTopicId: string | undefined;
    
    if (matchedTopic) {
      // Generate proper hierarchical URL for matched topic
      newTopicId = matchedTopic.id;
      const category = matchedTopic.categories;
      
      // Use enhanced reconstruction that preserves original URL structure
      newUrl = reconstructUrlPreservingOriginal(enhancedPattern, matchedTopic, category);
      console.log(`✅ Generated preserved URL: ${newUrl} for topic: ${matchedTopic.title}`);
      
    } else {
      // Generate new URL using preservation logic
      newUrl = generatePreservedUrl(enhancedPattern, categories);
      matchType = 'generated';
      confidence = enhancedPattern.extractedInfo?.preservedTopicId ? 0.7 : 0.5;
      console.log(`Generated preserved URL from pattern: ${newUrl} for original: ${enhancedPattern.path}`);
    }
    
    return {
      old_url: pattern.path,
      new_url: newUrl,
      url_type: 'topic',
      old_topic_id: pattern.topicId,
      new_topic_id: newTopicId,
      priority: confidence > 0.8 ? 1 : confidence > 0.5 ? 2 : 3,
      status: 'pending', // Force all to pending for manual review
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

// Optimized function to generate enhanced migrations with timeout protection
const generateEnhancedMigrations = async (
  supabase: any,
  patterns: OldUrlPattern[],
  batchSize: number = 500
): Promise<EnhancedMigration[]> => {
  const startTime = Date.now();
  const TIMEOUT_MS = 45000; // 45 second timeout to stay within edge function limits
  
  // Initialize variables outside try-catch for proper scope
  let flatTopics: any[] = [];
  let categories: any[] = [];
  let lookupMaps: any = null;
  
  console.log(`Generating enhanced migrations for ${patterns.length} patterns`);
  
  const migrations: EnhancedMigration[] = [];
  
  // Fetch essential data only for performance with reduced limits
  console.log('Fetching topics and categories for matching...');
  
  try {
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select(`
        id,
        title,
        slug,
        legacy_topic_id,
        categories!inner(
          id,
          slug,
          name,
          parent_category_id,
          parent_category:categories!parent_category_id(
            id,
            slug,
            name
          )
        )
      `)
      .eq('moderation_status', 'approved')
      .limit(1500); // Reduced limit for performance

    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
      throw new Error(`Failed to fetch topics for matching: ${topicsError.message}`);
    }

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        slug,
        parent_category_id,
        parent_category:categories!parent_category_id(
          id,
          slug,
          name
        )
      `)
      .eq('is_active', true)
      .limit(300); // Reduced limit

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      throw new Error(`Failed to fetch categories for matching: ${categoriesError.message}`);
    }

    // Validate and log the data structure
    console.log('Raw topics data sample:', topics?.slice(0, 1));
    console.log('Raw categories data sample:', categories?.slice(0, 1));

    // Flatten topics data properly with enhanced validation
    flatTopics = topics?.map(topic => {
      console.log('🔍 Processing topic:', topic.title);
      console.log('📂 Raw categories data:', JSON.stringify(topic.categories, null, 2));
      
      // Validate and normalize category data
      const normalizedCategories = topic.categories ? {
        ...topic.categories,
        parent_category: topic.categories.parent_category && 
                        typeof topic.categories.parent_category === 'object' &&
                        topic.categories.parent_category.slug !== 'undefined' 
                        ? topic.categories.parent_category 
                        : null
      } : null;
      
      console.log('📂 Normalized categories:', JSON.stringify(normalizedCategories, null, 2));
      
      return {
        id: topic.id,
        title: topic.title,
        slug: topic.slug,
        legacy_topic_id: topic.legacy_topic_id,
        categories: normalizedCategories
      };
    }) || [];

    if (flatTopics.length === 0) {
      console.warn('No topics were loaded! This will result in no migrations.');
    }

    if (!categories || categories.length === 0) {
      console.warn('No categories were loaded! This will affect URL generation.');
    }

    console.log(`Successfully loaded ${flatTopics.length} topics and ${categories?.length || 0} categories for matching`);
    console.log('Topics structure verified:', flatTopics[0] ? 'OK' : 'FAILED');
    console.log('Categories structure verified:', categories?.[0] ? 'OK' : 'FAILED');
  } catch (fetchError) {
    console.error('Critical error during data fetch:', fetchError);
    throw new Error(`Database fetch failed: ${fetchError.message}`);
  }
  
  // Build optimized lookup maps for faster searching
  const { topicTitleMap, categoryNameMap } = buildLookupMaps(flatTopics, categories || []);
  console.log('Built lookup maps for faster matching');

  // Process in smaller sub-batches with timeout protection
  const subBatchSize = 50; // Much smaller sub-batches for better progress tracking
  let processed = 0;
  let successfulMigrations = 0;
  let failedPatterns = 0;
  
  console.log(`Starting pattern processing: ${patterns.length} patterns to process`);
  
  for (let i = 0; i < patterns.length; i += subBatchSize) {
    // Check timeout before each sub-batch
    if (Date.now() - startTime > TIMEOUT_MS) {
      console.log(`⏰ Timeout reached after processing ${processed}/${patterns.length} patterns`);
      break;
    }
    
    const end = Math.min(i + subBatchSize, patterns.length);
    const subBatch = patterns.slice(i, end);
    const percentComplete = Math.round((i / patterns.length) * 100);
    
    console.log(`🔄 Processing sub-batch: ${i + 1}-${end}/${patterns.length} (${percentComplete}% complete)`);
    console.log(`📊 Progress: ${processed} processed, ${successfulMigrations} migrations created, ${failedPatterns} failed`);
    
    for (const pattern of subBatch) {
      try {
        console.log(`Processing pattern: ${pattern.type} - ${pattern.path} (topicId: ${pattern.topicId || 'none'})`);
        
        const migration = await generateMigrationForPattern(
          pattern, 
          flatTopics, 
          categories || [],
          topicTitleMap,
          categoryNameMap
        );
        
        if (migration) {
          migrations.push(migration);
          successfulMigrations++;
          console.log(`✅ Migration created: ${migration.old_url} -> ${migration.new_url} (${migration.match_type}, confidence: ${Math.round((migration.match_confidence || 0) * 100)}%)`);
        } else {
          console.log(`⚠️  No migration created for pattern: ${pattern.path} (type: ${pattern.type})`);
        }
        
        processed++;
        
        // Check timeout more frequently
        if (processed % 25 === 0) {
          const currentDuration = Date.now() - startTime;
          console.log(`📈 Checkpoint: ${processed}/${patterns.length} processed in ${currentDuration}ms`);
          
          if (currentDuration > TIMEOUT_MS) {
            console.log(`⏰ Timeout reached after processing ${processed} patterns`);
            break;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing pattern ${pattern.path}:`, error);
        failedPatterns++;
        processed++;
      }
    }
    
    // Break out of outer loop if timeout reached
    if (Date.now() - startTime > TIMEOUT_MS) {
      console.log(`⏰ Breaking outer loop due to timeout`);
      break;
    }
  }
  
  console.log(`🏁 Pattern processing complete:`);
  console.log(`   Total processed: ${processed}/${patterns.length}`);
  console.log(`   Successful migrations: ${successfulMigrations}`);
  console.log(`   Failed patterns: ${failedPatterns}`);
  console.log(`   Success rate: ${processed > 0 ? Math.round((successfulMigrations / processed) * 100) : 0}%`);

  const duration = Date.now() - startTime;
  console.log(`Generated ${migrations.length} migrations from ${processed} processed patterns in ${duration}ms`);
  console.log(`Processing rate: ${(processed / (duration / 1000)).toFixed(2)} patterns/second`);
  
  return migrations;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing request body:', JSON.stringify(req.body, null, 2));
    const { 
      sitemapUrl, 
      generateMigrations = false, 
      batchSize = 1000,
      startIndex = 0,
      batchIndex = 0
    } = await req.json();
    
    if (!sitemapUrl) {
      throw new Error('Sitemap URL is required');
    }

    console.log('Processing sitemap:', sitemapUrl);
    
    // For first batch or non-batched requests, fetch and process sitemap
    let patterns: OldUrlPattern[] = [];
    let totalUrls = 0;
    
    if (batchIndex === 0) {
      const urls = await fetchSitemap(sitemapUrl);
      patterns = processSitemapUrls(urls);
      totalUrls = patterns.length;
      console.log('Total URLs found:', totalUrls);
    }
    
    // For batched processing, only process a subset
    let batchPatterns = patterns;
    let totalBatches = 1;
    
    if (generateMigrations && batchIndex >= 0) {
      // If this is not the first batch, we need to re-fetch to get patterns
      if (batchIndex > 0) {
        const urls = await fetchSitemap(sitemapUrl);
        patterns = processSitemapUrls(urls);
        totalUrls = patterns.length;
      }
      
      totalBatches = Math.ceil(patterns.length / batchSize);
      const start = batchIndex * batchSize;
      const end = Math.min(start + batchSize, patterns.length);
      batchPatterns = patterns.slice(start, end);
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${batchPatterns.length} URLs)`);
    }
    
    // Create summary statistics for the current batch
    const summary = {
      total: totalUrls || batchPatterns.length,
      topics: batchPatterns.filter(p => p.type === 'topic').length,
      posts: batchPatterns.filter(p => p.type === 'post').length,
      categories: batchPatterns.filter(p => p.type === 'category').length,
      other: batchPatterns.filter(p => p.type === 'other').length,
      batchIndex,
      totalBatches,
      hasMore: batchIndex < totalBatches - 1
    };

    console.log('Processing complete. Summary:', summary);

    let migrations: EnhancedMigration[] = [];
    
    if (generateMigrations) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Only process the batch patterns for migration generation
      migrations = await generateEnhancedMigrations(supabase, batchPatterns, 500);
    }

    return new Response(
      JSON.stringify({
        success: true,
        patterns: batchPatterns,
        summary,
        migrations,
        migrationsCreated: migrations.length,
        batchInfo: {
          currentBatch: batchIndex + 1,
          totalBatches,
          hasMore: summary.hasMore,
          processedUrls: Math.min((batchIndex + 1) * batchSize, totalUrls || batchPatterns.length),
          totalUrls: totalUrls || batchPatterns.length,
          actualMigrationsGenerated: migrations.length,
          processingComplete: !summary.hasMore
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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
