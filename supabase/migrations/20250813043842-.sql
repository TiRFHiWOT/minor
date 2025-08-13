-- Create function to get most commented topics (Hot tab)
CREATE OR REPLACE FUNCTION get_most_commented_topics(
  limit_count INTEGER DEFAULT 10,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  category_id UUID,
  is_pinned BOOLEAN,
  is_locked BOOLEAN,
  view_count INTEGER,
  reply_count INTEGER,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username TEXT,
  avatar_url TEXT,
  category_name TEXT,
  category_color TEXT,
  category_slug TEXT,
  slug TEXT,
  last_post_id UUID,
  parent_category_id UUID,
  parent_category_slug TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    t.id,
    t.title,
    t.content,
    t.author_id,
    t.category_id,
    t.is_pinned,
    t.is_locked,
    t.view_count,
    t.reply_count,
    t.last_reply_at,
    t.created_at,
    t.updated_at,
    COALESCE(p.username, tu.display_name) as username,
    p.avatar_url,
    c.name as category_name,
    c.color as category_color,
    c.slug as category_slug,
    t.slug,
    t.last_post_id,
    c.parent_category_id,
    pc.slug as parent_category_slug
  FROM topics t
  LEFT JOIN profiles p ON t.author_id = p.user_id
  LEFT JOIN temporary_users tu ON t.author_id = tu.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN categories pc ON c.parent_category_id = pc.id
  WHERE t.moderation_status = 'approved'
  ORDER BY t.reply_count DESC, t.last_reply_at DESC
  LIMIT limit_count OFFSET offset_count;
$$;

-- Create function to get count of topics for most commented
CREATE OR REPLACE FUNCTION get_most_commented_topics_count()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM topics t
  WHERE t.moderation_status = 'approved';
$$;

-- Create function to get most viewed topics (Top tab)
CREATE OR REPLACE FUNCTION get_most_viewed_topics(
  limit_count INTEGER DEFAULT 10,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  category_id UUID,
  is_pinned BOOLEAN,
  is_locked BOOLEAN,
  view_count INTEGER,
  reply_count INTEGER,
  last_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username TEXT,
  avatar_url TEXT,
  category_name TEXT,
  category_color TEXT,
  category_slug TEXT,
  slug TEXT,
  last_post_id UUID,
  parent_category_id UUID,
  parent_category_slug TEXT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    t.id,
    t.title,
    t.content,
    t.author_id,
    t.category_id,
    t.is_pinned,
    t.is_locked,
    t.view_count,
    t.reply_count,
    t.last_reply_at,
    t.created_at,
    t.updated_at,
    COALESCE(p.username, tu.display_name) as username,
    p.avatar_url,
    c.name as category_name,
    c.color as category_color,
    c.slug as category_slug,
    t.slug,
    t.last_post_id,
    c.parent_category_id,
    pc.slug as parent_category_slug
  FROM topics t
  LEFT JOIN profiles p ON t.author_id = p.user_id
  LEFT JOIN temporary_users tu ON t.author_id = tu.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN categories pc ON c.parent_category_id = pc.id
  WHERE t.moderation_status = 'approved'
  ORDER BY t.view_count DESC, t.created_at DESC
  LIMIT limit_count OFFSET offset_count;
$$;

-- Create function to get count of topics for most viewed
CREATE OR REPLACE FUNCTION get_most_viewed_topics_count()
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM topics t
  WHERE t.moderation_status = 'approved';
$$;