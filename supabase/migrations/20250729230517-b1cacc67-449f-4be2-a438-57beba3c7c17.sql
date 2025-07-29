-- Update get_enriched_topics function to include last reply author information
CREATE OR REPLACE FUNCTION get_enriched_topics(
    p_category_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
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
    last_reply_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    slug TEXT,
    moderation_status TEXT,
    last_post_id UUID,
    author_username TEXT,
    author_avatar_url TEXT,
    category_name TEXT,
    category_color TEXT,
    category_slug TEXT,
    parent_category_id UUID,
    last_reply_username TEXT,
    last_reply_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_data AS (
    SELECT 
      t.id, t.title, t.content, t.author_id, t.category_id,
      t.is_pinned, t.is_locked, t.view_count, t.reply_count,
      t.last_reply_at, t.created_at, t.updated_at, t.slug, t.moderation_status,
      c.name as category_name, c.color as category_color, 
      c.slug as category_slug, c.parent_category_id
    FROM topics t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.moderation_status = 'approved'
      AND (p_category_id IS NULL OR t.category_id = p_category_id)
    ORDER BY t.is_pinned DESC, t.last_reply_at DESC
    LIMIT p_limit OFFSET p_offset
  ),
  last_posts AS (
    SELECT DISTINCT ON (td.id)
      td.id as topic_id,
      p.id as last_post_id,
      p.author_id as last_post_author_id
    FROM topic_data td
    LEFT JOIN posts p ON p.topic_id = td.id 
      AND p.moderation_status = 'approved'
    ORDER BY td.id, p.created_at DESC
  )
  SELECT 
    td.id,
    td.title,
    td.content,
    td.author_id,
    td.category_id,
    td.is_pinned,
    td.is_locked,
    td.view_count,
    td.reply_count,
    td.last_reply_at,
    td.created_at,
    td.updated_at,
    td.slug,
    td.moderation_status,
    lp.last_post_id,
    COALESCE(topic_pr.username, topic_tu.display_name) as author_username,
    topic_pr.avatar_url as author_avatar_url,
    td.category_name,
    td.category_color,
    td.category_slug,
    td.parent_category_id,
    COALESCE(last_pr.username, last_tu.display_name) as last_reply_username,
    last_pr.avatar_url as last_reply_avatar
  FROM topic_data td
  LEFT JOIN last_posts lp ON td.id = lp.topic_id
  LEFT JOIN profiles topic_pr ON td.author_id = topic_pr.id
  LEFT JOIN temporary_users topic_tu ON td.author_id = topic_tu.id
  LEFT JOIN profiles last_pr ON lp.last_post_author_id = last_pr.id
  LEFT JOIN temporary_users last_tu ON lp.last_post_author_id = last_tu.id
  ORDER BY td.is_pinned DESC, td.last_reply_at DESC;
END;
$$ LANGUAGE plpgsql;