-- Update get_enriched_topics to sort "new" topics by last_reply_at instead of created_at
DROP FUNCTION IF EXISTS get_enriched_topics(uuid, integer, integer);

CREATE OR REPLACE FUNCTION get_enriched_topics(p_category_id uuid DEFAULT NULL, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_sort_by text DEFAULT 'created_at')
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  author_id uuid,
  category_id uuid,
  is_pinned boolean,
  is_locked boolean,
  view_count integer,
  reply_count integer,
  last_reply_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  slug text,
  moderation_status text,
  is_anonymous boolean,
  ip_address inet,
  meta_title text,
  meta_description text,
  meta_keywords text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text,
  author_username text,
  author_avatar_url text,
  category_name text,
  category_color text,
  category_slug text,
  parent_category_id uuid,
  last_reply_username text,
  last_reply_avatar text,
  last_post_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
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
    t.slug,
    t.moderation_status,
    t.is_anonymous,
    t.ip_address,
    t.meta_title,
    t.meta_description,
    t.meta_keywords,
    t.canonical_url,
    t.og_title,
    t.og_description,
    t.og_image,
    COALESCE(p.username, tu.display_name) as author_username,
    p.avatar_url as author_avatar_url,
    c.name as category_name,
    c.color as category_color,
    c.slug as category_slug,
    c.parent_category_id,
    COALESCE(lp_p.username, lp_tu.display_name) as last_reply_username,
    lp_p.avatar_url as last_reply_avatar,
    last_post.id as last_post_id
  FROM topics t
  LEFT JOIN profiles p ON t.author_id = p.id
  LEFT JOIN temporary_users tu ON t.author_id = tu.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN LATERAL (
    SELECT id, author_id
    FROM posts 
    WHERE topic_id = t.id 
      AND moderation_status = 'approved'
    ORDER BY created_at DESC 
    LIMIT 1
  ) last_post ON true
  LEFT JOIN profiles lp_p ON last_post.author_id = lp_p.id
  LEFT JOIN temporary_users lp_tu ON last_post.author_id = lp_tu.id
  WHERE (p_category_id IS NULL OR t.category_id = p_category_id)
    AND t.moderation_status = 'approved'
  ORDER BY 
    t.is_pinned DESC,
    CASE 
      WHEN p_sort_by = 'last_reply_at' THEN t.last_reply_at
      ELSE t.created_at
    END DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;