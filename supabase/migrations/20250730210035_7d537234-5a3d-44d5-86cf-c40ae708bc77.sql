-- Populate ad_spaces table with existing ad spaces from the site
INSERT INTO ad_spaces (name, description, location, device_targeting, is_active, display_order, ad_code) VALUES
(
  'Leaderboard Top',
  'Top leaderboard advertisement displayed at the top of pages',
  'header',
  'both',
  true,
  1,
  '<div id="div-gpt-ad-1715358540790-0" style="min-width: 728px; min-height: 90px;"></div>'
),
(
  'Content One',
  'First content advertisement between posts',
  'content',
  'both',
  true,
  2,
  '<div id="div-gpt-ad-1715358598569-0" style="min-width: 728px; min-height: 90px;"></div>'
),
(
  'Content Two', 
  'Second content advertisement between posts',
  'content',
  'both',
  true,
  3,
  '<div id="div-gpt-ad-1715358620345-0" style="min-width: 728px; min-height: 90px;"></div>'
),
(
  'Sidebar Left',
  'Left sidebar advertisement',
  'sidebar',
  'desktop',
  true,
  4,
  '<div id="div-gpt-ad-1752247623844-0" style="min-width: 300px; min-height: 250px;"></div>'
),
(
  'Sidebar Left 2',
  'Second left sidebar advertisement',
  'sidebar', 
  'desktop',
  true,
  5,
  '<div id="div-gpt-ad-1752247724892-0" style="min-width: 300px; min-height: 250px;"></div>'
),
(
  'Content Three',
  'Third content advertisement between posts',
  'content',
  'both',
  true,
  6,
  '<div id="div-gpt-ad-1753889678213-0" style="min-width: 728px; min-height: 90px;"></div>'
),
(
  'Content Four',
  'Fourth content advertisement between posts', 
  'content',
  'both',
  true,
  7,
  '<div id="div-gpt-ad-1753889948554-0" style="min-width: 728px; min-height: 90px;"></div>'
),
(
  'Content Five',
  'Fifth content advertisement between posts',
  'content',
  'both', 
  true,
  8,
  '<div id="div-gpt-ad-1753890381531-0" style="min-width: 728px; min-height: 90px;"></div>'
);