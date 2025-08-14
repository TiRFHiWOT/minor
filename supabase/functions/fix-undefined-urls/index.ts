import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔧 Starting to fix URLs with /undefined/...');

    // Step 1: Query all URL migrations with /undefined/ in the new_url
    const { data: problematicUrls, error: queryError } = await supabase
      .from('url_migrations')
      .select('*')
      .like('new_url', '%/undefined/%');

    if (queryError) {
      console.error('❌ Error querying problematic URLs:', queryError);
      throw queryError;
    }

    console.log(`📊 Found ${problematicUrls?.length || 0} URLs with /undefined/ to fix`);

    if (!problematicUrls || problematicUrls.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No URLs with /undefined/ found',
        fixed_count: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    let fixedCount = 0;
    let failedCount = 0;
    const batchSize = 50;
    const failed: any[] = [];

    // Process in batches
    for (let i = 0; i < problematicUrls.length; i += batchSize) {
      const batch = problematicUrls.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(problematicUrls.length / batchSize)}`);

      for (const urlMigration of batch) {
        try {
          let newUrl = '';
          
          // Handle topic URLs
          if (urlMigration.new_topic_id) {
            console.log(`🎯 Fixing topic URL: ${urlMigration.old_url} -> ${urlMigration.new_url}`);
            
            // Get topic with category and parent category data
            const { data: topicData, error: topicError } = await supabase
              .from('topics')
              .select(`
                id,
                title,
                slug,
                categories:category_id (
                  id,
                  slug,
                  name,
                  parent_category_id,
                  parent_category:parent_category_id (
                    id,
                    slug,
                    name
                  )
                )
              `)
              .eq('id', urlMigration.new_topic_id)
              .single();

            if (topicError || !topicData) {
              console.error(`❌ Failed to get topic data for ID ${urlMigration.new_topic_id}:`, topicError);
              failed.push({ ...urlMigration, error: 'Topic not found' });
              failedCount++;
              continue;
            }

            const category = topicData.categories;
            
            // Reconstruct URL with proper parent handling
            if (category?.parent_category_id && 
                category?.parent_category && 
                typeof category.parent_category === 'object' && 
                category.parent_category.slug && 
                category.parent_category.slug !== 'undefined') {
              // Level 3 category: /parent-slug/category-slug/topic-slug
              newUrl = `/${category.parent_category.slug}/${category.slug}/${topicData.slug}`;
              console.log(`✅ Generated level 3 URL: ${newUrl}`);
            } else if (category?.slug) {
              // Level 2 category: /category-slug/topic-slug
              newUrl = `/${category.slug}/${topicData.slug}`;
              console.log(`✅ Generated level 2 URL: ${newUrl}`);
            } else {
              console.error(`❌ No valid category data for topic ${topicData.title}`);
              failed.push({ ...urlMigration, error: 'No valid category' });
              failedCount++;
              continue;
            }
          }
          // Handle category URLs
          else if (urlMigration.new_category_id) {
            console.log(`📁 Fixing category URL: ${urlMigration.old_url} -> ${urlMigration.new_url}`);
            
            // Get category with parent category data
            const { data: categoryData, error: categoryError } = await supabase
              .from('categories')
              .select(`
                id,
                slug,
                name,
                parent_category_id,
                parent_category:parent_category_id (
                  id,
                  slug,
                  name
                )
              `)
              .eq('id', urlMigration.new_category_id)
              .single();

            if (categoryError || !categoryData) {
              console.error(`❌ Failed to get category data for ID ${urlMigration.new_category_id}:`, categoryError);
              failed.push({ ...urlMigration, error: 'Category not found' });
              failedCount++;
              continue;
            }

            // Reconstruct category URL
            if (categoryData.parent_category_id && 
                categoryData.parent_category && 
                typeof categoryData.parent_category === 'object' && 
                categoryData.parent_category.slug && 
                categoryData.parent_category.slug !== 'undefined') {
              // Level 3 category: /parent-slug/category-slug
              newUrl = `/${categoryData.parent_category.slug}/${categoryData.slug}`;
              console.log(`✅ Generated level 3 category URL: ${newUrl}`);
            } else if (categoryData.slug) {
              // Level 2 category: /category-slug
              newUrl = `/${categoryData.slug}`;
              console.log(`✅ Generated level 2 category URL: ${newUrl}`);
            } else {
              console.error(`❌ No valid slug for category ${categoryData.name}`);
              failed.push({ ...urlMigration, error: 'No valid slug' });
              failedCount++;
              continue;
            }
          } else {
            console.error(`❌ URL migration has no topic_id or category_id: ${urlMigration.id}`);
            failed.push({ ...urlMigration, error: 'No target ID' });
            failedCount++;
            continue;
          }

          // Update the URL migration with the fixed URL
          if (newUrl && newUrl !== urlMigration.new_url) {
            const { error: updateError } = await supabase
              .from('url_migrations')
              .update({
                new_url: newUrl,
                updated_at: new Date().toISOString(),
                notes: (urlMigration.notes || '') + ` [Fixed /undefined/ URL on ${new Date().toISOString()}]`
              })
              .eq('id', urlMigration.id);

            if (updateError) {
              console.error(`❌ Failed to update URL migration ${urlMigration.id}:`, updateError);
              failed.push({ ...urlMigration, error: 'Update failed', newUrl });
              failedCount++;
            } else {
              console.log(`✅ Fixed: ${urlMigration.old_url} -> ${newUrl}`);
              fixedCount++;
            }
          } else {
            console.log(`⚠️ No change needed for ${urlMigration.old_url}`);
          }

        } catch (error) {
          console.error(`❌ Error processing URL migration ${urlMigration.id}:`, error);
          failed.push({ ...urlMigration, error: error.message });
          failedCount++;
        }
      }

      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < problematicUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const summary = {
      success: true,
      total_processed: problematicUrls.length,
      fixed_count: fixedCount,
      failed_count: failedCount,
      failed_urls: failed.slice(0, 10), // Only return first 10 failed for brevity
      message: `Fixed ${fixedCount} URLs, ${failedCount} failed`
    };

    console.log('🎉 URL fixing complete:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});