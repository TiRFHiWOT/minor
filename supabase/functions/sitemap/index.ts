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

function generateSitemapIndexXML(sitemaps: { loc: string; lastmod?: string }[]): string {
  const sitemapElements = sitemaps.map(sitemap => {
    let sitemapXML = `    <sitemap>\n        <loc>${sitemap.loc}</loc>\n`;
    if (sitemap.lastmod) {
      sitemapXML += `        <lastmod>${sitemap.lastmod}</lastmod>\n`;
    }
    sitemapXML += `    </sitemap>`;
    return sitemapXML;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapElements}
</sitemapindex>`;
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

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'index';

    // Try to get a canonical site URL from forum settings
    let siteSettingUrl: string | null = null;
    try {
      const { data: settings } = await supabase
        .from('forum_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'site_url')
        .maybeSingle();
      if (settings && settings.setting_value) {
        siteSettingUrl = String(settings.setting_value).replace(/\/$/, '');
      }
    } catch (e) {
      console.warn('Failed to read site_url from forum_settings:', e);
    }
    
    // Determine the base URL from settings or request headers
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const forwardedHost = req.headers.get('x-forwarded-host');
    const customDomain = req.headers.get('x-custom-domain');
    const host = req.headers.get('host');
    
    let baseUrl = siteSettingUrl || 'https://rscowwmoeycyxmfslhme.supabase.co';
    
    if (!siteSettingUrl) {
      // Priority: forwarded host > host header > custom domain > origin > referer
      if (forwardedHost && !forwardedHost.includes('supabase.co')) {
        baseUrl = `https://${forwardedHost}`;
      } else if (host && !host.includes('supabase.co')) {
        baseUrl = `https://${host}`;
      } else if (customDomain && !customDomain.includes('supabase.co')) {
        baseUrl = `https://${customDomain}`;
      } else if (origin && !origin.includes('supabase.co')) {
        baseUrl = origin;
      } else if (referer && !referer.includes('supabase.co')) {
        const refererUrl = new URL(referer);
        baseUrl = `${refererUrl.protocol}//${refererUrl.host}`;
      } else {
        // Final fallback to known custom domain
        baseUrl = 'https://minorhockeytalks.com';
      }
    }

    console.log(`Generating sitemap type: ${type}, baseUrl: ${baseUrl}, host: ${host}, forwarded-host: ${forwardedHost}, custom-domain: ${customDomain}, origin: ${origin}, referer: ${referer}`);

    let xmlContent = '';

    switch (type) {
      case 'index':
        const sitemaps = [
          { loc: `${baseUrl}/sitemap-static.xml`, lastmod: new Date().toISOString() },
          { loc: `${baseUrl}/sitemap-categories.xml`, lastmod: new Date().toISOString() },
          { loc: `${baseUrl}/sitemap-topics.xml`, lastmod: new Date().toISOString() },
          { loc: `${baseUrl}/sitemap-blog.xml`, lastmod: new Date().toISOString() },
        ];
        xmlContent = generateSitemapIndexXML(sitemaps);
        break;

      case 'static':
        const staticUrls: SitemapUrl[] = [
          { loc: baseUrl, priority: 1.0, changefreq: 'daily' },
          { loc: `${baseUrl}/categories`, priority: 0.9, changefreq: 'daily' },
          { loc: `${baseUrl}/blog`, priority: 0.8, changefreq: 'daily' },
          { loc: `${baseUrl}/login`, priority: 0.3, changefreq: 'monthly' },
          { loc: `${baseUrl}/register`, priority: 0.3, changefreq: 'monthly' },
          { loc: `${baseUrl}/terms`, priority: 0.2, changefreq: 'yearly' },
          { loc: `${baseUrl}/privacy`, priority: 0.2, changefreq: 'yearly' },
          { loc: `${baseUrl}/rules`, priority: 0.4, changefreq: 'monthly' },
        ];
        xmlContent = generateSitemapXML(staticUrls);
        break;

      case 'categories':
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('slug, updated_at, created_at, parent_category:parent_category_id(slug)')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        console.log(`Categories query result: ${categories?.length || 0} categories found`, categoriesError ? `Error: ${categoriesError.message}` : '');

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

        xmlContent = generateSitemapXML(categoryUrls);
        break;

      case 'topics':
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

        console.log(`Topics query result: ${topics?.length || 0} topics found`, topicsError ? `Error: ${topicsError.message}` : '');

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

        xmlContent = generateSitemapXML(topicUrls);
        break;

      case 'blog':
        const { data: blogPosts, error: blogError } = await supabase
          .from('blog_posts')
          .select('slug, updated_at, published_at')
          .eq('published_status', 'published')
          .order('published_at', { ascending: false });

        console.log(`Blog posts query result: ${blogPosts?.length || 0} blog posts found`, blogError ? `Error: ${blogError.message}` : '');

        const blogUrls: SitemapUrl[] = blogPosts?.map(post => ({
          loc: `${baseUrl}/blog/${post.slug}`,
          lastmod: post.updated_at || post.published_at,
          priority: 0.7,
          changefreq: 'monthly' as const,
        })) || [];

        xmlContent = generateSitemapXML(blogUrls);
        break;

      default:
        throw new Error('Invalid sitemap type');
    }

    console.log(`Generated sitemap with ${xmlContent.split('<url>').length - 1} URLs`);

    return new Response(xmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});