import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://minorhockeytalks.com';
const SITEMAP_DIR = './public';
const MAX_URLS_PER_SITEMAP = 50000; 

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

async function fetchData() {
  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  const { data: topics } = await supabase
    .from('topics')
    .select('*')
    .eq('is_published', true);

  const { data: blogPosts, error: blogError } = await supabase
  .from('blog_posts')
  .select('slug, updated_at, created_at')
  .eq('published_status', 'published');

if (blogError) console.error('Error fetching blog posts:', blogError);

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('is_public', true);

  return { categories, topics, blogPosts, users };
}

function buildXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('')}
</urlset>`;
}

async function generateSitemap() {
  const { categories, topics, blogPosts, users } = await fetchData();

  const safeCategories = categories || [];
  const safeTopics = topics || [];
  const safeBlogPosts = blogPosts || [];
  const safeUsers = users || [];

  let urls = [];

  urls.push({
    loc: BASE_URL,
    lastmod: formatDate(new Date()),
    changefreq: 'weekly',
    priority: 1.0
  });


  safeCategories.forEach(cat => {
    urls.push({
      loc: `${BASE_URL}/category/${cat.slug}`,
      lastmod: formatDate(cat.updated_at || cat.created_at),
      changefreq: 'weekly',
      priority: 0.8
    });
  });

  safeTopics.forEach(topic => {
    urls.push({
      loc: `${BASE_URL}/${topic.category_slug}/${topic.slug}`,
      lastmod: formatDate(topic.updated_at || topic.created_at),
      changefreq: 'monthly',
      priority: 0.6
    });
  });


urls.push({
  loc: `${BASE_URL}/blogs`,
  lastmod: formatDate(new Date()), 
  changefreq: 'weekly',
  priority: 0.7
});


(blogPosts || []).forEach(post => {
  urls.push({
    loc: `${BASE_URL}/blog/${post.slug}`,
    lastmod: formatDate(post.updated_at || post.created_at),
    changefreq: 'monthly',
    priority: 0.5
  });
});



  safeUsers.forEach(user => {
    urls.push({
      loc: `${BASE_URL}/user/${user.username}`,
      lastmod: formatDate(user.updated_at || user.created_at),
      changefreq: 'monthly',
      priority: 0.4
    });
  });


const sitemapFiles = [];

if (urls.length <= MAX_URLS_PER_SITEMAP) {
  const xml = buildXml(urls);
  fs.writeFileSync(`${SITEMAP_DIR}/sitemap.xml`, xml);
  sitemapFiles.push('sitemap.xml');
  console.log(`✅ Generated sitemap.xml with ${urls.length} URLs`);
} else {
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_SITEMAP) {
    const chunk = urls.slice(i, i + MAX_URLS_PER_SITEMAP);
    const xmlChunk = buildXml(chunk);
    const filename = `sitemap${i / MAX_URLS_PER_SITEMAP + 1}.xml`;
    fs.writeFileSync(`${SITEMAP_DIR}/${filename}`, xmlChunk);
    sitemapFiles.push(filename);
    console.log(`✅ Generated ${filename} with ${chunk.length} URLs`);
  }

  const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles.map(f => `<sitemap><loc>${BASE_URL}/${f}</loc></sitemap>`).join('\n')}
</sitemapindex>`;
  fs.writeFileSync(`${SITEMAP_DIR}/sitemap_index.xml`, sitemapIndexXml);
  console.log('✅ Generated sitemap_index.xml');
}
}

generateSitemap().catch(err => {
  console.error('❌ Error generating sitemap:', err);
});
