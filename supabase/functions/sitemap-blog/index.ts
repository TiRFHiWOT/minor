import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const host = req.headers.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    
    // Use actual domain when called via Supabase functions
    const actualHost = host?.includes("supabase") || host?.includes("edge-runtime") 
      ? "minorhockeytalks.com" 
      : host;
    const baseUrl = `${protocol}://${actualHost}`;

    console.log(`Generating blog sitemap for baseUrl: ${baseUrl}`);

    const { data: blogPosts, error } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq('published_status', 'published')
      .order("published_at", { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`Blog posts query result: ${blogPosts?.length || 0} blog posts found`);

    // Include static blog and general pages
    const staticUrls = [
      `<url>
  <loc>${baseUrl}/blog</loc>
  <priority>0.8</priority>
  <changefreq>daily</changefreq>
</url>`,
      `<url>
  <loc>${baseUrl}/login</loc>
  <priority>0.3</priority>
  <changefreq>monthly</changefreq>
</url>`,
      `<url>
  <loc>${baseUrl}/register</loc>
  <priority>0.3</priority>
  <changefreq>monthly</changefreq>
</url>`,
      `<url>
  <loc>${baseUrl}/terms</loc>
  <priority>0.2</priority>
  <changefreq>yearly</changefreq>
</url>`,
      `<url>
  <loc>${baseUrl}/privacy</loc>
  <priority>0.2</priority>
  <changefreq>yearly</changefreq>
</url>`,
      `<url>
  <loc>${baseUrl}/rules</loc>
  <priority>0.4</priority>
  <changefreq>monthly</changefreq>
</url>`
    ];

    const blogUrls = blogPosts?.map((post) => {
      return `<url>
  <loc>${baseUrl}/blog/${post.slug}</loc>
  <lastmod>${new Date(post.updated_at || post.published_at).toISOString()}</lastmod>
  <priority>0.7</priority>
  <changefreq>monthly</changefreq>
</url>`;
    }) || [];

    const allUrls = [...staticUrls, ...blogUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.join("\n")}
</urlset>`;

    console.log(`Generated blog sitemap with ${allUrls.length} URLs`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
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