-- Add three new Level 2 discussion topics for general hockey talk

-- Add "General Hockey Talk Canada" under "Youth Hockey Canada Talk"
INSERT INTO categories (id, name, description, level, parent_category_id, slug, sort_order, created_at)
VALUES (
  gen_random_uuid(),
  'General Hockey Talk Canada',
  'General discussion about hockey in Canada',
  2,
  '11111111-1111-1111-1111-111111111111', -- Youth Hockey Canada Talk
  'general-hockey-talk-canada',
  1,
  now()
);

-- Add "General Hockey Talk USA" under "Youth Hockey USA Talk"  
INSERT INTO categories (id, name, description, level, parent_category_id, slug, sort_order, created_at)
VALUES (
  gen_random_uuid(),
  'General Hockey Talk USA',
  'General discussion about hockey in the USA',
  2,
  '22222222-2222-2222-2222-222222222222', -- Youth Hockey USA Talk
  'general-hockey-talk-usa',
  1,
  now()
);

-- Add "General Hockey Talk" under "General Youth Hockey Talk"
INSERT INTO categories (id, name, description, level, parent_category_id, slug, sort_order, created_at)
VALUES (
  gen_random_uuid(),
  'General Hockey Talk',
  'General discussion about youth hockey',
  2,
  '33333333-3333-3333-3333-333333333333', -- General Youth Hockey Talk
  'general-hockey-talk',
  1,
  now()
);