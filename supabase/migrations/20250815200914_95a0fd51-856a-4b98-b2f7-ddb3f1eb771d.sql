-- Add forum settings for SEO configuration
INSERT INTO forum_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES
  ('forum_name_override', '"Minor Hockey Talks"', 'string', 'seo', 'Custom forum name for SEO titles', true),
  ('seo_title_separator', '" | "', 'string', 'seo', 'Separator used in SEO titles', true),
  ('seo_auto_generate_topic_titles', 'true', 'boolean', 'seo', 'Enable automatic topic title generation', false),
  ('seo_auto_generate_category_titles', 'true', 'boolean', 'seo', 'Enable automatic category title generation', false)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = now();