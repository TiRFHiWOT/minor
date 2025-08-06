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

    console.log(`Generating topics sitemap for baseUrl: ${baseUrl}`);

    // Pull topics with hierarchical category information
    const { data: topics, error } = await supabase
      .from("topics")
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
      .order("updated_at", { ascending: false })
      .limit(50000);

    if (error) {
      throw error;
    }

    console.log(`Topics query result: ${topics?.length || 0} topics found`);

    const urls = topics?.map((topic) => {
      const category = topic.categories;
      if (!category?.slug) return ""; // Skip if no category

      let topicUrl = '';
      if (category.parent_category?.slug) {
        // Level 3 category: /parent-slug/subcategory-slug/topic-slug
        topicUrl = `${baseUrl}/${category.parent_category.slug}/${category.slug}/${topic.slug}`;
      } else {
        // Level 2 category: /category-slug/topic-slug
        topicUrl = `${baseUrl}/${category.slug}/${topic.slug}`;
      }

      return `<url>
  <loc>${topicUrl}</loc>
  <lastmod>${new Date(topic.updated_at || topic.created_at).toISOString()}</lastmod>
  <priority>0.6</priority>
  <changefreq>weekly</changefreq>
</url>`;
    }).filter(Boolean) || [];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    console.log(`Generated topics sitemap with ${urls.length} URLs`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
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