-- Initialize header_scripts setting if it doesn't exist
INSERT INTO forum_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES (
  'header_scripts',
  '[]'::jsonb,
  'json',
  'advertising',
  'Array of header scripts to be injected into the page header',
  false
)
ON CONFLICT (setting_key) DO NOTHING;