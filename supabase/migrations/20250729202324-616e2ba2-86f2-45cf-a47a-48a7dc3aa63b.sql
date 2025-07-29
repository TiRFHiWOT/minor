-- Update header_code setting to replace AdSense with AdMetricsPro
UPDATE public.forum_settings 
SET setting_value = '"<!--  Start AdMetricsPro Head Code for minorhockeytalks.com -->\n<script src=''https://qd.admetricspro.com/js/minorhockeytalks/new-layout-loader.js''></script>\n<!--  End AdMetricsPro Head Code for minorhockeytalks.com -->\n<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-RFQVZPVL0N\"></script>"'
WHERE setting_key = 'header_code';