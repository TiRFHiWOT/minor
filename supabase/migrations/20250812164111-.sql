-- Continue with remaining database function security hardening
-- Fix search_path for all remaining functions to prevent SQL injection

CREATE OR REPLACE FUNCTION public.record_anonymous_post(user_ip inet, session_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Insert or update the tracking record
  INSERT INTO public.anonymous_post_tracking (ip_address, session_id, post_count, last_post_at)
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
  DELETE FROM public.anonymous_post_tracking 
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

-- Add session timeout mechanism
INSERT INTO public.forum_settings (setting_key, setting_value, setting_type, category, description, is_public)
VALUES 
  ('session_timeout_minutes', '480'::jsonb, 'integer', 'security', 'Session timeout in minutes (8 hours default)', false),
  ('max_login_attempts', '5'::jsonb, 'integer', 'security', 'Maximum login attempts before temporary lockout', false),
  ('lockout_duration_minutes', '15'::jsonb, 'integer', 'security', 'Account lockout duration in minutes', false)
ON CONFLICT (setting_key) DO NOTHING;