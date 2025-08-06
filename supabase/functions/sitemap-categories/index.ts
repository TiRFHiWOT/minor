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

    console.log(`Generating categories sitemap for baseUrl: ${baseUrl}`);

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('slug, updated_at, created_at, parent_category:parent_category_id(slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (categoriesError) {
      throw categoriesError;
    }

    console.log(`Categories query result: ${categories?.length || 0} categories found`);

    // Include static category pages
    const staticUrls: SitemapUrl[] = [
      { loc: baseUrl, priority: 1.0, changefreq: 'daily' },
      { loc: `${baseUrl}/categories`, priority: 0.9, changefreq: 'daily' },
    ];

    const categoryUrls: SitemapUrl[] = categories?.map(category => {
      let categoryUrl = '';
      if (category.parent_category?.slug) {
        categoryUrl = `${baseUrl}/${category.parent_category.slug}/${category.slug}`;
      } else {
        categoryUrl = `${baseUrl}/${category.slug}`;
      }

      return {
        loc: categoryUrl,
        lastmod: category.updated_at || category.created_at,
        priority: category.parent_category ? 0.7 : 0.8,
        changefreq: 'weekly' as const,
      };
    }) || [];

    const allUrls = [...staticUrls, ...categoryUrls];
    const xmlContent = generateSitemapXML(allUrls);

    console.log(`Generated categories sitemap with ${allUrls.length} URLs`);

    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error generating categories sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});