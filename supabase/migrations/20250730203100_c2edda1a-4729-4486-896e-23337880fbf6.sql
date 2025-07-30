-- Add hardcoded AdSense script to header_scripts and clean up legacy header_code
UPDATE forum_settings 
SET setting_value = jsonb_insert(
  COALESCE(setting_value, '[]'::jsonb),
  '{1}',
  '{
    "id": "google-adsense-script",
    "name": "Google AdSense Script",
    "description": "Google AdSense initialization script for sidebar and other ad placements",
    "script": "<script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5447109336224364\" crossorigin=\"anonymous\"></script>",
    "is_active": true
  }'::jsonb
)
WHERE setting_key = 'header_scripts';

-- Clear the legacy header_code since we're consolidating everything into header_scripts
UPDATE forum_settings 
SET setting_value = '""'::jsonb
WHERE setting_key = 'header_code';