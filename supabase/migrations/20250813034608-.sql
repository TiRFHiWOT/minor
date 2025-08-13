-- Clear all duplicate advertising settings from database
-- This removes duplicates since we're hardcoding everything in index.html

-- Remove header scripts (contains duplicate AdSense and AdMetrics)
DELETE FROM forum_settings WHERE setting_key = 'header_scripts';

-- Remove Google Analytics ID (duplicate of hardcoded)
DELETE FROM forum_settings WHERE setting_key = 'google_analytics_id';

-- Remove Google AdSense client ID if it exists
DELETE FROM forum_settings WHERE setting_key = 'google_adsense_client_id';