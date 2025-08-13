-- Update RPC functions to use topics and posts tables

-- Update get_enriched_posts function to query posts table
CREATE OR REPLACE FUNCTION public.get_enriched_posts(p_topic_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  content text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  author_id uuid,
  topic_id uuid,
  parent_post_id uuid,
  moderation_status text,
  is_anonymous boolean,
  username text,
  avatar_url text,
  display_name text,
  is_temp_user boolean,
  parent_content text,
  parent_author text,
  parent_created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    p.created_at,
    p.updated_at,
    p.author_id,
    p.topic_id,
    p.parent_post_id,
    p.moderation_status,
    p.is_anonymous,
    COALESCE(prof.username, tu.display_name) as username,
    prof.avatar_url,
    tu.display_name,
    CASE WHEN tu.id IS NOT NULL THEN true ELSE false END as is_temp_user,
    pp.content as parent_content,
    COALESCE(parent_prof.username, parent_tu.display_name) as parent_author,
    pp.created_at as parent_created_at
  FROM posts p
  LEFT JOIN profiles prof ON p.author_id = prof.id
  LEFT JOIN temporary_users tu ON p.author_id = tu.id
  LEFT JOIN posts pp ON p.parent_post_id = pp.id
  LEFT JOIN profiles parent_prof ON pp.author_id = parent_prof.id
  LEFT JOIN temporary_users parent_tu ON pp.author_id = parent_tu.id
  WHERE p.topic_id = p_topic_id
    AND p.moderation_status = 'approved'
  ORDER BY p.created_at ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Update get_enriched_posts_count function to query posts table
CREATE OR REPLACE FUNCTION public.get_enriched_posts_count(p_topic_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  post_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO post_count
  FROM posts p
  WHERE p.topic_id = p_topic_id
    AND p.moderation_status = 'approved';
    
  RETURN post_count;
END;
$$;

-- Update get_enriched_topics function to query topics table (if needed)
CREATE OR REPLACE FUNCTION public.get_enriched_topics(p_category_id uuid DEFAULT NULL, p_limit integer DEFAULT 10, p_offset integer DEFAULT 0, p_sort_by text DEFAULT 'created_at')
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  author_id uuid,
  category_id uuid,
  is_pinned boolean,
  is_locked boolean,
  view_count integer,
  reply_count integer,
  last_reply_at timestamp with time zone,
  moderation_status text,
  is_anonymous boolean,
  slug text,
  username text,
  avatar_url text,
  display_name text,
  is_temp_user boolean,
  category_name text,
  category_color text,
  category_slug text,
  last_post_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  sort_column text;
BEGIN
  -- Validate and set sort column
  CASE p_sort_by
    WHEN 'created_at' THEN sort_column := 't.created_at DESC';
    WHEN 'updated_at' THEN sort_column := 't.updated_at DESC';
    WHEN 'last_reply_at' THEN sort_column := 't.last_reply_at DESC';
    WHEN 'view_count' THEN sort_column := 't.view_count DESC';
    WHEN 'reply_count' THEN sort_column := 't.reply_count DESC';
    ELSE sort_column := 't.created_at DESC';
  END CASE;

  RETURN QUERY EXECUTE format('
    SELECT 
      t.id,
      t.title,
      t.content,
      t.created_at,
      t.updated_at,
      t.author_id,
      t.category_id,
      t.is_pinned,
      t.is_locked,
      t.view_count,
      t.reply_count,
      t.last_reply_at,
      t.moderation_status,
      t.is_anonymous,
      t.slug,
      COALESCE(prof.username, tu.display_name) as username,
      prof.avatar_url,
      tu.display_name,
      CASE WHEN tu.id IS NOT NULL THEN true ELSE false END as is_temp_user,
      c.name as category_name,
      c.color as category_color,
      c.slug as category_slug,
      (
        SELECT p.id 
        FROM posts p 
        WHERE p.topic_id = t.id 
          AND p.moderation_status = ''approved''
        ORDER BY p.created_at DESC 
        LIMIT 1
      ) as last_post_id
    FROM topics t
    LEFT JOIN profiles prof ON t.author_id = prof.id
    LEFT JOIN temporary_users tu ON t.author_id = tu.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE ($1 IS NULL OR t.category_id = $1)
      AND t.moderation_status = ''approved''
    ORDER BY t.is_pinned DESC, %s
    LIMIT $2
    OFFSET $3
  ', sort_column)
  USING p_category_id, p_limit, p_offset;
END;
$$;

-- Update get_enriched_topics_count function to query topics table
CREATE OR REPLACE FUNCTION public.get_enriched_topics_count(p_category_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  topic_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO topic_count
  FROM topics t
  WHERE (p_category_id IS NULL OR t.category_id = p_category_id)
    AND t.moderation_status = 'approved';
    
  RETURN topic_count;
END;
$$;