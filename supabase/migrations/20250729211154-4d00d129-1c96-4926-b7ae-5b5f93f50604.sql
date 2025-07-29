-- Update the get_enriched_topics function to include last reply author information
CREATE OR REPLACE FUNCTION public.get_enriched_topics(p_category_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, content text, author_id uuid, category_id uuid, is_pinned boolean, is_locked boolean, view_count integer, reply_count integer, last_reply_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, slug text, moderation_status text, last_post_id uuid, author_username text, author_avatar_url text, category_name text, category_color text, category_slug text, parent_category_id uuid, last_reply_username text, last_reply_avatar text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
      p.author_id as last_post_author_id,
      p.is_anonymous as last_post_is_anonymous
    FROM topic_data td
    LEFT JOIN posts p ON p.topic_id = td.id 
      AND p.moderation_status = 'approved'
    ORDER BY td.id, p.created_at DESC
  ),
  last_reply_authors AS (
    SELECT 
      lp.topic_id,
      lp.last_post_id,
      CASE 
        WHEN lp.last_post_is_anonymous = true OR lp.last_post_author_id IS NULL THEN 'Guest'
        ELSE COALESCE(pr.username, tu.display_name, 'Guest')
      END as last_reply_username,
      CASE 
        WHEN lp.last_post_is_anonymous = true OR lp.last_post_author_id IS NULL THEN NULL
        ELSE pr.avatar_url
      END as last_reply_avatar
    FROM last_posts lp
    LEFT JOIN profiles pr ON lp.last_post_author_id = pr.id AND lp.last_post_is_anonymous = false
    LEFT JOIN temporary_users tu ON lp.last_post_author_id = tu.id AND lp.last_post_is_anonymous = false
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
    lra.last_post_id,
    COALESCE(pr.username, tu.display_name) as author_username,
    pr.avatar_url as author_avatar_url,
    td.category_name,
    td.category_color,
    td.category_slug,
    td.parent_category_id,
    lra.last_reply_username,
    lra.last_reply_avatar
  FROM topic_data td
  LEFT JOIN last_reply_authors lra ON td.id = lra.topic_id
  LEFT JOIN profiles pr ON td.author_id = pr.id
  LEFT JOIN temporary_users tu ON td.author_id = tu.id
  ORDER BY td.is_pinned DESC, td.last_reply_at DESC;
END;
$function$