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

    console.log(`Generating blog sitemap for baseUrl: ${baseUrl}`);

    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('published_status', 'published')
      .order('published_at', { ascending: false });

    if (blogError) {
      throw blogError;
    }

    console.log(`Blog posts query result: ${blogPosts?.length || 0} blog posts found`);

    // Include static blog pages
    const staticUrls: SitemapUrl[] = [
      { loc: `${baseUrl}/blog`, priority: 0.8, changefreq: 'daily' },
      { loc: `${baseUrl}/login`, priority: 0.3, changefreq: 'monthly' },
      { loc: `${baseUrl}/register`, priority: 0.3, changefreq: 'monthly' },
      { loc: `${baseUrl}/terms`, priority: 0.2, changefreq: 'yearly' },
      { loc: `${baseUrl}/privacy`, priority: 0.2, changefreq: 'yearly' },
      { loc: `${baseUrl}/rules`, priority: 0.4, changefreq: 'monthly' },
    ];

    const blogUrls: SitemapUrl[] = blogPosts?.map(post => ({
      loc: `${baseUrl}/blog/${post.slug}`,
      lastmod: post.updated_at || post.published_at,
      priority: 0.7,
      changefreq: 'monthly' as const,
    })) || [];

    const allUrls = [...staticUrls, ...blogUrls];
    const xmlContent = generateSitemapXML(allUrls);

    console.log(`Generated blog sitemap with ${allUrls.length} URLs`);

    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error generating blog sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});