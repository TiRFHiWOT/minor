-- Remove the duplicate AdMetricsPro script from header_code setting
UPDATE public.forum_settings 
SET setting_value = '""'::jsonb 
WHERE setting_key = 'header_code';