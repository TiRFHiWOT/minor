-- Update forum settings to use correct name and add SEO auto-generation settings
INSERT INTO public.forum_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES 
  ('forum_name_override', '"Minor Hockey Forum"', 'string', 'seo', 'Override the default forum name for SEO purposes', true),
  ('seo_auto_generate_topic_titles', 'true', 'boolean', 'seo', 'Automatically generate SEO titles for topics', false),
  ('seo_auto_generate_category_titles', 'true', 'boolean', 'seo', 'Automatically generate SEO titles for categories', false),
  ('seo_title_separator', '" | "', 'string', 'seo', 'Separator used in auto-generated SEO titles', false)
ON CONFLICT (setting_key) 
DO UPDATE SET 
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = now();

-- Function to bulk update topic metadata
CREATE OR REPLACE FUNCTION bulk_update_topic_metadata()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update all topics with auto-generated metadata
  UPDATE topics 
  SET 
    meta_title = CASE 
      WHEN meta_title IS NULL OR meta_title = '' THEN
        topics.title || ' | Minor Hockey Forum | ' || COALESCE(categories.name, 'General')
      ELSE meta_title -- Keep existing custom titles
    END,
    meta_description = CASE 
      WHEN meta_description IS NULL OR meta_description = '' THEN
        CASE 
          WHEN topics.content IS NOT NULL AND LENGTH(topics.content) > 0 THEN
            SUBSTRING(regexp_replace(topics.content, '<[^>]*>', '', 'g') FROM 1 FOR 150) || '...'
          ELSE
            'Join the discussion about ' || topics.title || ' in ' || COALESCE(categories.name, 'General') || ' on Minor Hockey Forum.'
        END
      ELSE meta_description -- Keep existing custom descriptions
    END,
    updated_at = now()
  FROM categories
  WHERE topics.category_id = categories.id;
  
  RAISE NOTICE 'Updated metadata for % topics', (SELECT COUNT(*) FROM topics);
END;
$$;

-- Function to bulk update category metadata  
CREATE OR REPLACE FUNCTION bulk_update_category_metadata()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update all categories with auto-generated metadata
  UPDATE categories 
  SET 
    meta_title = CASE 
      WHEN meta_title IS NULL OR meta_title = '' THEN
        categories.name || ' | Minor Hockey Forum'
      ELSE meta_title -- Keep existing custom titles
    END,
    meta_description = CASE 
      WHEN meta_description IS NULL OR meta_description = '' THEN
        'Explore ' || categories.name || ' topics and join the discussion on Minor Hockey Forum.'
      ELSE meta_description -- Keep existing custom descriptions
    END
  WHERE is_active = true;
  
  RAISE NOTICE 'Updated metadata for % categories', (SELECT COUNT(*) FROM categories WHERE is_active = true);
END;
$$;

-- Execute the bulk updates
SELECT bulk_update_topic_metadata();
SELECT bulk_update_category_metadata();

-- Clean up the temporary functions (optional)
DROP FUNCTION IF EXISTS bulk_update_topic_metadata();
DROP FUNCTION IF EXISTS bulk_update_category_metadata();