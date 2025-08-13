-- Remove AdMetrics configurations from database to prevent duplicate ad containers
-- Keep only the React component placements

-- Remove header scripts that inject ad containers
DELETE FROM public.forum_settings 
WHERE setting_key = 'header_scripts' 
AND setting_value::text LIKE '%div-gpt-ad-1715358540790-0%';

-- Remove any ad_spaces entries that might be injecting duplicate containers
DROP TABLE IF EXISTS public.ad_spaces;