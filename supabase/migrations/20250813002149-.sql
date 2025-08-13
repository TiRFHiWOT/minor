-- Fix the get_enriched_posts function to use the correct table structure
DROP FUNCTION IF EXISTS get_enriched_posts(uuid, integer, integer);

CREATE OR REPLACE FUNCTION get_enriched_posts(p_topic_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  content text,
  author_id uuid,
  topic_id uuid,
  parent_post_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  moderation_status text,
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

-- Also fix the count function if it has the same issue
DROP FUNCTION IF EXISTS get_enriched_posts_count(uuid);

CREATE OR REPLACE FUNCTION get_enriched_posts_count(p_topic_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM forum_posts fp
    WHERE fp.topic_id = p_topic_id 
      AND fp.moderation_status = 'approved'
  );
END;
$function$;