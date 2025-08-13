-- Drop trigger first, then function to avoid dependency issues
DROP TRIGGER IF EXISTS sync_topic_to_forum_trigger ON topics;
DROP FUNCTION IF EXISTS sync_topic_to_forum() CASCADE;

-- Drop and recreate get_forum_stats to use correct table names
DROP FUNCTION IF EXISTS get_forum_stats();
CREATE OR REPLACE FUNCTION public.get_forum_stats()
 RETURNS TABLE(total_topics bigint, total_posts bigint, total_members bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM topics WHERE moderation_status = 'approved') as total_topics,
    (SELECT COUNT(*) FROM posts WHERE moderation_status = 'approved') as total_posts,
    (SELECT COUNT(*) FROM profiles) as total_members;
END;
$function$;

-- Drop and recreate get_topics_count if it exists
DROP FUNCTION IF EXISTS get_topics_count(uuid);
CREATE OR REPLACE FUNCTION public.get_topics_count(category_id_param uuid DEFAULT NULL)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF category_id_param IS NULL THEN
    RETURN (
      SELECT COUNT(*)::integer
      FROM topics
      WHERE moderation_status = 'approved'
    );
  ELSE
    RETURN (
      SELECT COUNT(*)::integer
      FROM topics
      WHERE category_id = category_id_param
        AND moderation_status = 'approved'
    );
  END IF;
END;
$function$;

-- Update get_most_viewed_topics_count
DROP FUNCTION IF EXISTS get_most_viewed_topics_count();
CREATE OR REPLACE FUNCTION public.get_most_viewed_topics_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM topics
    WHERE moderation_status = 'approved'
      AND view_count > 0
  );
END;
$function$;

-- Update get_most_commented_topics
DROP FUNCTION IF EXISTS get_most_commented_topics(integer);
CREATE OR REPLACE FUNCTION public.get_most_commented_topics(limit_count integer DEFAULT 10)
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
  WHERE t.moderation_status = 'approved'
    AND t.reply_count > 0
  ORDER BY t.reply_count DESC, t.created_at DESC
  LIMIT limit_count;
END;
$function$;