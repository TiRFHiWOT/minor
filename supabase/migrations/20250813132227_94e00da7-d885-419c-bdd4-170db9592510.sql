-- Update main forum name setting and clean up existing meta titles
-- Step 1: Update the main forum_name setting
UPDATE forum_settings 
SET setting_value = '"Minor Hockey Forum"'
WHERE setting_key = 'forum_name';

-- Step 2: Remove the forum_name_override setting since we don't need it anymore
DELETE FROM forum_settings 
WHERE setting_key = 'forum_name_override';

-- Step 3: Update all existing topic meta_title values to use the correct forum name
UPDATE topics 
SET meta_title = REPLACE(meta_title, 'Minor Hockey Talks', 'Minor Hockey Forum')
WHERE meta_title LIKE '%Minor Hockey Talks%';