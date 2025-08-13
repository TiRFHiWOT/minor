-- Drop the problematic trigger and function that reference forum_posts
DROP TRIGGER IF EXISTS sync_post_to_forum_trigger ON posts;
DROP FUNCTION IF EXISTS sync_post_to_forum();

-- Update get_hot_topics_count function to use topics instead of forum_topics
DROP FUNCTION IF EXISTS get_hot_topics_count();
CREATE OR REPLACE FUNCTION public.get_hot_topics_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM topics t
    WHERE t.created_at >= NOW() - INTERVAL '7 days'
      AND t.moderation_status = 'approved'
  );
END;
$function$;

-- Update any other functions that might reference forum_topics or forum_posts
-- Check if get_posts_count exists and update it
DROP FUNCTION IF EXISTS get_posts_count(uuid);
CREATE OR REPLACE FUNCTION public.get_posts_count(topic_id_param uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM posts p
    WHERE p.topic_id = topic_id_param
      AND p.moderation_status = 'approved'
  );
END;
$function$;

-- Update get_hot_topics if it exists
DROP FUNCTION IF EXISTS get_hot_topics(integer);
CREATE OR REPLACE FUNCTION public.get_hot_topics(limit_count integer DEFAULT 10)
 RETURNS TABLE(
   id uuid,
   title text,
   created_at timestamp with time zone,
   reply_count integer,
   view_count integer
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
    t.created_at,
    t.reply_count,
    t.view_count
  FROM topics t
  WHERE t.created_at >= NOW() - INTERVAL '7 days'
    AND t.moderation_status = 'approved'
  ORDER BY 
    (t.reply_count + (t.view_count / 10)) DESC,
    t.created_at DESC
  LIMIT limit_count;
END;
$function$;