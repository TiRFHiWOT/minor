-- Update all database functions to use public forum tables instead of restricted tables

-- Update get_enriched_topics to use forum_topics
CREATE OR REPLACE FUNCTION public.get_enriched_topics(p_category_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, content text, author_id uuid, category_id uuid, is_pinned boolean, is_locked boolean, view_count integer, reply_count integer, last_reply_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, slug text, moderation_status text, last_post_id uuid, author_username text, author_avatar_url text, category_name text, category_color text, category_slug text, parent_category_id uuid, last_reply_username text, last_reply_avatar text)
 LANGUAGE plpgsql
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
    FROM forum_topics t
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
    LEFT JOIN forum_posts p ON p.topic_id = td.id 
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
$function$;

-- Update get_topics_count to use forum_topics
CREATE OR REPLACE FUNCTION public.get_topics_count(p_category_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF p_category_id IS NULL THEN
    RETURN (
      SELECT COUNT(*)::integer
      FROM forum_topics 
      WHERE moderation_status = 'approved'
    );
  ELSE
    RETURN (
      SELECT COUNT(*)::integer
      FROM forum_topics 
      WHERE category_id = p_category_id 
      AND moderation_status = 'approved'
    );
  END IF;
END;
$function$;

-- Update get_hot_topics to use forum_topics
CREATE OR REPLACE FUNCTION public.get_hot_topics(limit_count integer DEFAULT 25, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, content text, author_id uuid, category_id uuid, is_pinned boolean, is_locked boolean, view_count integer, reply_count integer, last_reply_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, username text, avatar_url text, category_name text, category_color text, category_slug text, slug text, hot_score numeric, last_post_id uuid, parent_category_id uuid, parent_category_slug text)
 LANGUAGE plpgsql
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
    COALESCE(p.username, tu.display_name) as username,
    p.avatar_url,
    c.name as category_name,
    c.color as category_color,
    c.slug as category_slug,
    t.slug,
    -- Hot score calculation: prioritize reply count, view count, and recency
    (
      COALESCE(t.reply_count, 0) * 10 +
      COALESCE(t.view_count, 0) * 0.1 +
      -- Boost recent topics (decay factor based on hours since creation)
      GREATEST(0, 100 - EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600)
    )::numeric as hot_score,
    -- Get the most recent post ID for this topic
    (
      SELECT posts.id 
      FROM forum_posts posts 
      WHERE posts.topic_id = t.id 
        AND posts.moderation_status = 'approved'
      ORDER BY posts.created_at DESC 
      LIMIT 1
    ) as last_post_id,
    -- Include parent category information
    c.parent_category_id,
    pc.slug as parent_category_slug
  FROM forum_topics t
  LEFT JOIN profiles p ON t.author_id = p.id
  LEFT JOIN temporary_users tu ON t.author_id = tu.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN categories pc ON c.parent_category_id = pc.id
  WHERE t.created_at >= NOW() - INTERVAL '7 days'
    AND t.moderation_status = 'approved'
  ORDER BY hot_score DESC, t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- Update get_hot_topics_count to use forum_topics
CREATE OR REPLACE FUNCTION public.get_hot_topics_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM forum_topics t
    WHERE t.created_at >= NOW() - INTERVAL '7 days'
      AND t.moderation_status = 'approved'
  );
END;
$function$;

-- Update get_most_commented_topics to use forum_topics
CREATE OR REPLACE FUNCTION public.get_most_commented_topics(limit_count integer DEFAULT 25, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, content text, author_id uuid, category_id uuid, is_pinned boolean, is_locked boolean, view_count integer, reply_count integer, last_reply_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, username text, avatar_url text, category_name text, category_color text, category_slug text, slug text, last_post_id uuid, parent_category_id uuid, parent_category_slug text)
 LANGUAGE plpgsql
 SECURITY DEFINER
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
    COALESCE(p.username, tu.display_name) as username,
    p.avatar_url,
    c.name as category_name,
    c.color as category_color,
    c.slug as category_slug,
    t.slug,
    -- Get the most recent post ID for this topic
    (
      SELECT posts.id 
      FROM forum_posts posts 
      WHERE posts.topic_id = t.id 
        AND posts.moderation_status = 'approved'
      ORDER BY posts.created_at DESC 
      LIMIT 1
    ) as last_post_id,
    -- Include parent category information
    c.parent_category_id,
    pc.slug as parent_category_slug
  FROM forum_topics t
  LEFT JOIN profiles p ON t.author_id = p.id
  LEFT JOIN temporary_users tu ON t.author_id = tu.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN categories pc ON c.parent_category_id = pc.id
  WHERE t.moderation_status = 'approved'
  ORDER BY t.reply_count DESC, t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- Update get_most_commented_topics_count to use forum_topics
CREATE OR REPLACE FUNCTION public.get_most_commented_topics_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM forum_topics t
    WHERE t.moderation_status = 'approved'
  );
END;
$function$;

-- Update get_most_viewed_topics to use forum_topics
CREATE OR REPLACE FUNCTION public.get_most_viewed_topics(limit_count integer DEFAULT 25, offset_count integer DEFAULT 0)
 RETURNS TABLE(id uuid, title text, content text, author_id uuid, category_id uuid, is_pinned boolean, is_locked boolean, view_count integer, reply_count integer, last_reply_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, username text, avatar_url text, category_name text, category_color text, category_slug text, slug text, last_post_id uuid, parent_category_id uuid, parent_category_slug text)
 LANGUAGE plpgsql
 SECURITY DEFINER
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
    COALESCE(p.username, tu.display_name) as username,
    p.avatar_url,
    c.name as category_name,
    c.color as category_color,
    c.slug as category_slug,
    t.slug,
    -- Get the most recent post ID for this topic
    (
      SELECT posts.id 
      FROM forum_posts posts 
      WHERE posts.topic_id = t.id 
        AND posts.moderation_status = 'approved'
      ORDER BY posts.created_at DESC 
      LIMIT 1
    ) as last_post_id,
    -- Include parent category information
    c.parent_category_id,
    pc.slug as parent_category_slug
  FROM forum_topics t
  LEFT JOIN profiles p ON t.author_id = p.id
  LEFT JOIN temporary_users tu ON t.author_id = tu.id
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN categories pc ON c.parent_category_id = pc.id
  WHERE t.moderation_status = 'approved'
  ORDER BY t.view_count DESC, t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;

-- Update get_most_viewed_topics_count to use forum_topics
CREATE OR REPLACE FUNCTION public.get_most_viewed_topics_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM forum_topics t
    WHERE t.moderation_status = 'approved'
  );
END;
$function$;

-- Update get_enriched_posts to use forum_posts
CREATE OR REPLACE FUNCTION public.get_enriched_posts(p_topic_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, content text, author_id uuid, topic_id uuid, parent_post_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, moderation_status text, ip_address inet, is_anonymous boolean, author_username text, author_avatar_url text, parent_post_content text, parent_post_author_username text, parent_post_author_avatar_url text, parent_post_created_at timestamp with time zone, parent_post_moderation_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH post_data AS (
    SELECT 
      p.id, p.content, p.author_id, p.topic_id, p.parent_post_id,
      p.created_at, p.updated_at, p.moderation_status, p.is_anonymous
    FROM forum_posts p
    WHERE p.topic_id = p_topic_id
      AND p.moderation_status = 'approved'
    ORDER BY p.created_at ASC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT 
    pd.id,
    pd.content,
    pd.author_id,
    pd.topic_id,
    pd.parent_post_id,
    pd.created_at,
    pd.updated_at,
    pd.moderation_status,
    -- Always return null for ip_address since this is public function
    NULL::inet as ip_address,
    pd.is_anonymous,
    -- Author information
    COALESCE(pr.username, tu.display_name) as author_username,
    pr.avatar_url as author_avatar_url,
    -- Parent post information
    pp.content as parent_post_content,
    COALESCE(ppr.username, ptu.display_name) as parent_post_author_username,
    ppr.avatar_url as parent_post_author_avatar_url,
    pp.created_at as parent_post_created_at,
    pp.moderation_status as parent_post_moderation_status
  FROM post_data pd
  -- Join author data
  LEFT JOIN profiles pr ON pd.author_id = pr.id
  LEFT JOIN temporary_users tu ON pd.author_id = tu.id
  -- Join parent post data
  LEFT JOIN forum_posts pp ON pd.parent_post_id = pp.id
  LEFT JOIN profiles ppr ON pp.author_id = ppr.id
  LEFT JOIN temporary_users ptu ON pp.author_id = ptu.id
  ORDER BY pd.created_at ASC;
END;
$function$;

-- Update get_posts_count to use forum_posts
CREATE OR REPLACE FUNCTION public.get_posts_count(p_topic_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM forum_posts 
    WHERE topic_id = p_topic_id 
    AND moderation_status = 'approved'
  );
END;
$function$;