import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      url_migrations: {
        Row: {
          id: string;
          old_url: string;
          new_url: string;
          status: string;
          url_type: string;
          confidence_score: number;
        };
      };
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    // Fetch all active URL migrations
    const { data: migrations, error } = await supabase
      .from('url_migrations')
      .select('old_url, new_url, status')
      .eq('status', 'active')
      .order('old_url');

    if (error) {
      console.error('Error fetching migrations:', error);
      throw error;
    }

    console.log(`Found ${migrations?.length || 0} active URL migrations`);

    // Generate _redirects file content
    let redirectsContent = '';
    
    // Add existing manual redirects first
    redirectsContent += `/sitemap.xml https://hockey.minorhockeytalks.com/functions/v1/sitemap 200\n\n`;
    redirectsContent += `# Pretty sitemap endpoints\n`;
    redirectsContent += `/sitemap-static.xml https://hockey.minorhockeytalks.com/functions/v1/sitemap?type=static 200\n`;
    redirectsContent += `/sitemap-categories.xml https://hockey.minorhockeytalks.com/functions/v1/sitemap?type=categories 200\n`;
    redirectsContent += `/sitemap-topics.xml https://hockey.minorhockeytalks.com/functions/v1/sitemap?type=topics 200\n`;
    redirectsContent += `/sitemap-blog.xml https://hockey.minorhockeytalks.com/functions/v1/sitemap?type=blog 200\n\n`;
    redirectsContent += `# RSS Feed redirect\n`;
    redirectsContent += `/rss.xml https://rscowwmoeycyxmfslhme.supabase.co/functions/v1/rss-feed 200\n\n`;
    
    // Add URL migration redirects
    redirectsContent += `# Auto-generated URL migrations (${new Date().toISOString()})\n`;
    
    if (migrations && migrations.length > 0) {
      for (const migration of migrations) {
        // Use 301 permanent redirect for SEO
        redirectsContent += `${migration.old_url} ${migration.new_url} 301\n`;
      }
    }

    return new Response(redirectsContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
      },
    });

  } catch (error) {
    console.error('Error generating redirects:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate redirects' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});