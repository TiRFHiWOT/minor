-- Create the missing set_forum_setting function
CREATE OR REPLACE FUNCTION set_forum_setting(
  key_name TEXT,
  value JSONB,
  setting_type TEXT DEFAULT 'string',
  category TEXT DEFAULT 'general',
  description TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO forum_settings (setting_key, setting_value, setting_type, category, description, is_public, created_at, updated_at)
  VALUES (key_name, value, setting_type, category, description, true, NOW(), NOW())
  ON CONFLICT (setting_key) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    setting_type = EXCLUDED.setting_type,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    updated_at = NOW();
END;
$$;