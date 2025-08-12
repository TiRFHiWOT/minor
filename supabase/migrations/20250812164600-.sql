-- COMPREHENSIVE SECURITY FIXES - Phase 5 (Final)
-- Complete the remaining database function search_path vulnerabilities

-- Continue with remaining batch of functions
CREATE OR REPLACE FUNCTION public.get_poll_results(poll_id_param uuid)
 RETURNS TABLE(option_id uuid, option_text text, display_order integer, vote_count bigint, percentage numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  total_votes BIGINT;
BEGIN
  -- Get total votes for this poll
  SELECT COUNT(*) INTO total_votes
  FROM public.poll_votes pv
  WHERE pv.poll_id = poll_id_param;
  
  -- Return results with vote counts and percentages
  RETURN QUERY
  SELECT 
    po.id as option_id,
    po.option_text,
    po.display_order,
    COALESCE(COUNT(pv.id), 0) as vote_count,
    CASE 
      WHEN total_votes = 0 THEN 0
      ELSE ROUND((COALESCE(COUNT(pv.id), 0) * 100.0) / total_votes, 2)
    END as percentage
  FROM public.poll_options po
  LEFT JOIN public.poll_votes pv ON po.id = pv.option_id
  WHERE po.poll_id = poll_id_param
  GROUP BY po.id, po.option_text, po.display_order
  ORDER BY po.display_order;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_enriched_topics_count(p_category_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM topics t
    WHERE t.moderation_status = 'approved'
      AND (p_category_id IS NULL OR t.category_id = p_category_id)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_spam_detection_data()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Remove old anonymous tracking data (older than 7 days)
  DELETE FROM public.anonymous_post_tracking 
  WHERE created_at < (now() - interval '7 days');
  
  -- Remove old content analysis data (older than 30 days)
  DELETE FROM public.content_analysis 
  WHERE created_at < (now() - interval '30 days');
  
  -- Remove old behavior patterns (older than 7 days)
  DELETE FROM public.user_behavior_patterns 
  WHERE created_at < (now() - interval '7 days');
  
  -- Remove resolved spam reports older than 90 days
  DELETE FROM public.spam_reports 
  WHERE status IN ('resolved', 'false_positive') 
    AND created_at < (now() - interval '90 days');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_enriched_posts_count(p_topic_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM posts p
    WHERE p.topic_id = p_topic_id
      AND p.moderation_status = 'approved'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_poll_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.topic_notifications
    WHERE user_id = p_user_id AND is_read = false
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_categories_by_activity(p_parent_category_id uuid DEFAULT NULL::uuid, p_category_level integer DEFAULT NULL::integer)
 RETURNS TABLE(id uuid, name text, description text, slug text, color text, sort_order integer, is_active boolean, created_at timestamp with time zone, parent_category_id uuid, level integer, region text, birth_year integer, play_level text, last_activity_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH category_activity AS (
    -- Get the most recent activity for each category
    SELECT 
      c.id as category_id,
      GREATEST(
        COALESCE(MAX(t.last_reply_at), '1970-01-01'::timestamp with time zone),
        COALESCE(MAX(t.created_at), '1970-01-01'::timestamp with time zone)
      ) as last_activity
    FROM categories c
    LEFT JOIN topics t ON t.category_id = c.id
    WHERE c.is_active = true
      AND (p_parent_category_id IS NULL OR c.parent_category_id = p_parent_category_id)
      AND (p_category_level IS NULL OR c.level = p_category_level)
    GROUP BY c.id
  )
  SELECT 
    c.id,
    c.name,
    c.description,
    c.slug,
    c.color,
    c.sort_order,
    c.is_active,
    c.created_at,
    c.parent_category_id,
    c.level,
    c.region,
    c.birth_year,
    c.play_level,
    CASE 
      WHEN ca.last_activity = '1970-01-01'::timestamp with time zone 
      THEN NULL 
      ELSE ca.last_activity 
    END as last_activity_at
  FROM categories c
  LEFT JOIN category_activity ca ON c.id = ca.category_id
  WHERE c.is_active = true
    AND (p_parent_category_id IS NULL OR c.parent_category_id = p_parent_category_id)
    AND (p_category_level IS NULL OR c.level = p_category_level)
  ORDER BY 
    CASE 
      WHEN ca.last_activity = '1970-01-01'::timestamp with time zone 
      THEN c.created_at 
      ELSE ca.last_activity 
    END DESC NULLS LAST,
    c.name ASC;
END;
$function$;