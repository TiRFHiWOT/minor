-- Create missing get_enriched_posts_count function to match what the frontend expects
CREATE OR REPLACE FUNCTION public.get_enriched_posts_count(p_topic_id uuid)
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