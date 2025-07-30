-- Update existing Sidebar Left ad space to use location 'sidebar' and add proper AdSense code
UPDATE ad_spaces 
SET 
  location = 'sidebar',
  ad_code = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5447109336224364"
     crossorigin="anonymous"></script>
<!-- Sidebar Advertisement -->
<ins class="adsbygoogle"
     style="display:block;width:100%;min-height:250px"
     data-ad-client="ca-pub-5447109336224364"
     data-ad-slot="4012372906"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>',
  updated_at = now()
WHERE name = 'Sidebar Left';

-- Update between_posts ad space with proper AdSense code
UPDATE ad_spaces 
SET 
  ad_code = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5447109336224364"
     crossorigin="anonymous"></script>
<!-- Between Posts Advertisement -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-5447109336224364"
     data-ad-slot="1741636049"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>',
  updated_at = now()
WHERE location = 'between_posts';