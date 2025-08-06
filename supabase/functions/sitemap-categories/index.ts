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
    // Use the actual domain instead of edge runtime host
    const baseUrl = "https://minorhockeytalks.com";

    console.log(`Generating categories sitemap for baseUrl: ${baseUrl}`);

    const { data: categories, error } = await supabase
      .from("categories")
      .select("slug, updated_at, created_at, parent_category:parent_category_id(slug)")
      .eq('is_active', true)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`Categories query result: ${categories?.length || 0} categories found`);

    // Include static category pages
    const staticUrls = [
      `<url>
  <loc>${baseUrl}</loc>
  <priority>1.0</priority>
  <changefreq>daily</changefreq>
</url>`,
      `<url>
  <loc>${baseUrl}/categories</loc>
  <priority>0.9</priority>
  <changefreq>daily</changefreq>
</url>`
    ];

    const categoryUrls = categories?.map((category) => {
      let categoryUrl = '';
      if (category.parent_category?.slug) {
        // Level 3 category: /parent-slug/subcategory-slug
        categoryUrl = `${baseUrl}/${category.parent_category.slug}/${category.slug}`;
      } else {
        // Level 2 category: /category-slug
        categoryUrl = `${baseUrl}/${category.slug}`;
      }

      return `<url>
  <loc>${categoryUrl}</loc>
  <lastmod>${new Date(category.updated_at || category.created_at).toISOString()}</lastmod>
  <priority>${category.parent_category ? '0.7' : '0.8'}</priority>
  <changefreq>weekly</changefreq>
</url>`;
    }) || [];

    const allUrls = [...staticUrls, ...categoryUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.join("\n")}
</urlset>`;

    console.log(`Generated categories sitemap with ${allUrls.length} URLs`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
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