-- Update existing topic meta_title records to replace "Minor Hockey Forum" with "Minor Hockey Talks"
UPDATE topics 
SET meta_title = REPLACE(meta_title, 'Minor Hockey Forum', 'Minor Hockey Talks')
WHERE meta_title LIKE '%Minor Hockey Forum%';

-- Update existing category meta_title records to replace "Minor Hockey Forum" with "Minor Hockey Talks"  
UPDATE categories
SET meta_title = REPLACE(meta_title, 'Minor Hockey Forum', 'Minor Hockey Talks')
WHERE meta_title LIKE '%Minor Hockey Forum%';