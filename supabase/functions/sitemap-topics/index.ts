import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlElements = urls.map(url => {
    let urlXML = `    <url>\n        <loc>${url.loc}</loc>\n`;
    if (url.lastmod) {
      urlXML += `        <lastmod>${url.lastmod}</lastmod>\n`;
    }
    if (url.changefreq) {
      urlXML += `        <changefreq>${url.changefreq}</changefreq>\n`;
    }
    if (url.priority !== undefined) {
      urlXML += `        <priority>${url.priority}</priority>\n`;
    }
    urlXML += `    </url>`;
    return urlXML;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    console.log(`Generating topics sitemap for baseUrl: ${baseUrl}`);

    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select(`
        slug, 
        updated_at, 
        created_at,
        categories:category_id(
          slug,
          parent_category:parent_category_id(slug)
        )
      `)
      .eq('moderation_status', 'approved')
      .order('updated_at', { ascending: false })
      .limit(50000);

    if (topicsError) {
      throw topicsError;
    }

    console.log(`Topics query result: ${topics?.length || 0} topics found`);

    const topicUrls: SitemapUrl[] = topics?.map(topic => {
      let topicUrl = '';
      if (topic.categories?.parent_category?.slug) {
        topicUrl = `${baseUrl}/${topic.categories.parent_category.slug}/${topic.categories.slug}/${topic.slug}`;
      } else if (topic.categories?.slug) {
        topicUrl = `${baseUrl}/${topic.categories.slug}/${topic.slug}`;
      } else {
        topicUrl = `${baseUrl}/topic/${topic.slug}`;
      }

      return {
        loc: topicUrl,
        lastmod: topic.updated_at || topic.created_at,
        priority: 0.6,
        changefreq: 'weekly' as const,
      };
    }) || [];

    const xmlContent = generateSitemapXML(topicUrls);

    console.log(`Generated topics sitemap with ${topicUrls.length} URLs`);

    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error generating topics sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});