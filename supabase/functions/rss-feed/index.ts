import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const supabaseUrl = "https://rscowwmoeycyxmfslhme.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzY293d21vZXljeXhtZnNsaG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0OTMyNTQsImV4cCI6MjA2NzA2OTI1NH0.qUsm6rt8cPME0Xe8ctUGgXkYufZ8zS-pE0QBh9GLGhQ";

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSOptions {
  categorySlug?: string;
  limit?: number;
}

const escapeXml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const truncateText = (text: string, maxLength: number = 160): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

const generateRSSFeed = async (options: RSSOptions = {}): Promise<string> => {
  const { categorySlug, limit = 25 } = options;

  // Get forum settings
  const { data: forumSettings } = await supabase
    .from('forum_settings')
    .select('setting_key, setting_value')
    .in('setting_key', [
      'forum_name', 
      'forum_description', 
      'site_url',
      'rss_enabled',
      'rss_title',
      'rss_description'
    ]);

  const settings = forumSettings?.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.setting_value;
    return acc;
  }, {} as Record<string, any>) || {};

  // Check if RSS is enabled
  if (settings.rss_enabled === false) {
    throw new Error('RSS feed is disabled');
  }

  const siteName = settings.forum_name || 'Minor Hockey Talks';
  const siteDescription = settings.forum_description || 'Join the leading online community for minor hockey players, parents, and coaches.';
  const siteUrl = settings.site_url || 'https://rscowwmoeycyxmfslhme.supabase.co';
  const rssTitle = settings.rss_title || siteName;
  const rssDescription = settings.rss_description || siteDescription;

  // Get category ID if categorySlug is provided
  let categoryId = null;
  if (categorySlug) {
    const { data: category } = await supabase
      .from('categories')
      .select('id, name')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .single();
    
    if (category) {
      categoryId = category.id;
    }
  }

  // Fetch topics using the optimized function
  const { data: topics, error } = await supabase.rpc('get_enriched_topics', {
    p_category_id: categoryId,
    p_limit: limit,
    p_offset: 0
  });

  if (error) {
    console.error('Error fetching topics for RSS:', error);
    throw new Error('Failed to fetch topics');
  }

  const feedTitle = categorySlug 
    ? `${rssTitle} - ${categorySlug}`
    : rssTitle;

  const feedDescription = categorySlug
    ? `Latest topics from ${categorySlug} category on ${siteName}`
    : rssDescription;

  const buildDate = new Date().toUTCString();
  const lastBuildDate = topics && topics.length > 0 
    ? new Date(topics[0].created_at).toUTCString()
    : buildDate;

  let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <description>${escapeXml(feedDescription)}</description>
    <link>${escapeXml(siteUrl)}</link>
    <atom:link href="${escapeXml(siteUrl)}/rss${categorySlug ? `?category=${categorySlug}` : ''}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <pubDate>${buildDate}</pubDate>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>Minor Hockey Talks RSS Feed</generator>
    <managingEditor>noreply@minorhockeytalks.com (Minor Hockey Talks)</managingEditor>
    <webMaster>noreply@minorhockeytalks.com (Minor Hockey Talks)</webMaster>
    <ttl>60</ttl>
`;

  if (topics && topics.length > 0) {
    for (const topic of topics) {
      const topicUrl = topic.category_slug && topic.slug
        ? `${siteUrl}/${topic.category_slug}/${topic.slug}`
        : `${siteUrl}/topic/${topic.id}`;

      const author = topic.author_username || 'Guest';
      const category = topic.category_name || 'General';
      const pubDate = new Date(topic.created_at).toUTCString();
      
      // Create description with topic stats
      const contentPreview = topic.content 
        ? truncateText(topic.content.replace(/<[^>]*>/g, ''), 200)
        : 'No content available';
      
      const description = `${contentPreview}\n\nCategory: ${category} | Author: ${author} | Replies: ${topic.reply_count || 0} | Views: ${topic.view_count || 0}`;

      rssXml += `
    <item>
      <title>${escapeXml(topic.title)}</title>
      <link>${escapeXml(topicUrl)}</link>
      <description>${escapeXml(description)}</description>
      <author>noreply@minorhockeytalks.com (${escapeXml(author)})</author>
      <category>${escapeXml(category)}</category>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(topicUrl)}</guid>
    </item>`;
    }
  }

  rssXml += `
  </channel>
</rss>`;

  return rssXml;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const categorySlug = url.searchParams.get('category') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '25');

    const rssXml = await generateRSSFeed({ 
      categorySlug, 
      limit: Math.min(limit, 50) // Cap at 50 items
    });

    return new Response(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // 5 minutes cache
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('RSS feed error:', error);
    
    // Return a basic error RSS feed
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>RSS Feed Error</title>
    <description>RSS feed is temporarily unavailable</description>
    <link>https://rscowwmoeycyxmfslhme.supabase.co</link>
  </channel>
</rss>`;

    return new Response(errorXml, {
      status: 500,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);