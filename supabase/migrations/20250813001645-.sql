-- Update the enriched functions to use the public forum_topics and forum_posts tables

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_enriched_topics(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_enriched_topics_count(uuid);
DROP FUNCTION IF EXISTS public.get_enriched_posts(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_enriched_posts_count(uuid);

-- Create get_enriched_topics function using forum_topics
CREATE OR REPLACE FUNCTION public.get_enriched_topics(
  p_category_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 10,
  p_offset integer DEFAULT 0
)
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
    ft.id,
    ft.title,
    ft.content,
    ft.author_id,
    ft.category_id,
    ft.is_pinned,
    ft.is_locked,
    ft.view_count,
    ft.reply_count,
    ft.last_reply_at,
    ft.created_at,
    ft.updated_at,
    ft.slug,
    ft.moderation_status,
    ft.is_anonymous,
    COALESCE(p.username, tu.display_name) as author_username,
    p.avatar_url as author_avatar_url,
    c.name as category_name,
    c.color as category_color,
    c.slug as category_slug,
    c.parent_category_id,
    lrp_profile.username as last_reply_username,
    lrp_profile.avatar_url as last_reply_avatar,
    (
      SELECT fp.id 
      FROM forum_posts fp 
      WHERE fp.topic_id = ft.id 
      AND fp.moderation_status = 'approved'
      ORDER BY fp.created_at DESC 
      LIMIT 1
    ) as last_post_id
  FROM forum_topics ft
  LEFT JOIN categories c ON ft.category_id = c.id
  LEFT JOIN profiles p ON ft.author_id = p.id
  LEFT JOIN temporary_users tu ON ft.author_id = tu.id
  LEFT JOIN (
    SELECT DISTINCT ON (fp.topic_id) 
      fp.topic_id,
      fp.author_id,
      fp.created_at
    FROM forum_posts fp 
    WHERE fp.moderation_status = 'approved'
    ORDER BY fp.topic_id, fp.created_at DESC
  ) last_post ON ft.id = last_post.topic_id
  LEFT JOIN profiles lrp_profile ON last_post.author_id = lrp_profile.id
  WHERE ft.moderation_status = 'approved'
    AND (p_category_id IS NULL OR ft.category_id = p_category_id)
  ORDER BY ft.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;

-- Create get_enriched_topics_count function
CREATE OR REPLACE FUNCTION public.get_enriched_topics_count(p_category_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM forum_topics ft
    WHERE ft.moderation_status = 'approved'
      AND (p_category_id IS NULL OR ft.category_id = p_category_id)
  );
END;
$function$;

-- Create get_enriched_posts function using forum_posts
CREATE OR REPLACE FUNCTION public.get_enriched_posts(
  p_topic_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  content text,
  author_id uuid,
  topic_id uuid,
  parent_post_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  moderation_status text,
  ip_address inet,
  is_anonymous boolean,
  author_username text,
  author_avatar_url text,
  parent_post_content text,
  parent_post_created_at timestamp with time zone,
  parent_post_moderation_status text,
  parent_post_author_username text,
  parent_post_author_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    fp.id,
    fp.content,
    fp.author_id,
    fp.topic_id,
    fp.parent_post_id,
    fp.created_at,
    fp.updated_at,
    fp.moderation_status,
    fp.ip_address,
    fp.is_anonymous,
    COALESCE(p.username, tu.display_name) as author_username,
    p.avatar_url as author_avatar_url,
    parent_fp.content as parent_post_content,
    parent_fp.created_at as parent_post_created_at,
    parent_fp.moderation_status as parent_post_moderation_status,
    COALESCE(parent_p.username, parent_tu.display_name) as parent_post_author_username,
    parent_p.avatar_url as parent_post_author_avatar_url
  FROM forum_posts fp
  LEFT JOIN profiles p ON fp.author_id = p.id
  LEFT JOIN temporary_users tu ON fp.author_id = tu.id
  LEFT JOIN forum_posts parent_fp ON fp.parent_post_id = parent_fp.id
  LEFT JOIN profiles parent_p ON parent_fp.author_id = parent_p.id
  LEFT JOIN temporary_users parent_tu ON parent_fp.author_id = parent_tu.id
  WHERE fp.topic_id = p_topic_id 
    AND fp.moderation_status = 'approved'
  ORDER BY fp.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;