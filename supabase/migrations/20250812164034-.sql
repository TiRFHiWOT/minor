-- COMPREHENSIVE SECURITY FIXES - Phase 2
-- Database Function Hardening - Fix all remaining search_path vulnerabilities

-- Fix all remaining functions with search_path security issues
CREATE OR REPLACE FUNCTION public.record_anonymous_post(user_ip inet, session_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Insert or update the tracking record
  INSERT INTO anonymous_post_tracking (ip_address, session_id, post_count, last_post_at)
  VALUES (user_ip, record_anonymous_post.session_id, 1, now())
  ON CONFLICT (ip_address, session_id) 
  DO UPDATE SET 
    post_count = anonymous_post_tracking.post_count + 1,
    last_post_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.fix_backwards_posts()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Update posts with backwards content
  -- This is a manual process - you'll need to identify specific posts
  -- For now, this creates the infrastructure to fix them
  
  -- Example usage (commented out - uncomment and modify as needed):
  -- UPDATE posts SET content = reverse_text_content(content) WHERE id = 'specific-post-id';
  -- UPDATE topics SET content = reverse_text_content(content) WHERE id = 'specific-topic-id';
  
  RAISE NOTICE 'Functions created for fixing backwards text. Use reverse_text_content() to fix specific posts.';
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_anonymous_content(content text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  -- Check for common image formats
  IF content ~* '\.(jpg|jpeg|png|gif|bmp|webp|svg)' THEN
    RETURN false;
  END IF;
  
  -- Check for URLs (http/https)
  IF content ~* 'https?://[^\s]+' THEN
    RETURN false;
  END IF;
  
  -- Check for markdown image syntax
  IF content ~* '!\[.*\]\(.*\)' THEN
    RETURN false;
  END IF;
  
  -- Check for markdown link syntax
  IF content ~* '\[.*\]\(.*\)' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_anonymous_tracking()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM anonymous_post_tracking 
  WHERE created_at < (now() - interval '24 hours');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_peak_visitors_24h()
 RETURNS TABLE(peak_count integer, peak_hour timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT ip_address)::integer as peak_count,
    DATE_TRUNC('hour', created_at) as peak_hour
  FROM public.ip_visit_tracking
  WHERE created_at > (now() - interval '24 hours')
  GROUP BY DATE_TRUNC('hour', created_at)
  ORDER BY peak_count DESC
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_forum_stats()
 RETURNS TABLE(total_topics bigint, total_posts bigint, total_members bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM topics) as total_topics,
    (SELECT COUNT(*) FROM posts) as total_posts,
    (SELECT COUNT(*) FROM profiles) as total_members;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_peak_daily_visitors()
 RETURNS TABLE(peak_count integer, peak_date date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT pv.peak_count, pv.peak_date
  FROM public.peak_daily_visitors_tracking pv
  ORDER BY pv.created_at DESC
  LIMIT 1;
END;
$function$;