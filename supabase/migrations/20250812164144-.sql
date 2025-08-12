-- COMPREHENSIVE SECURITY FIXES - Phase 3
-- Continue fixing database function search_path vulnerabilities

-- Fix more functions with search_path security issues
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  
  -- Set published_at when status changes to published
  IF NEW.published_status = 'published' AND (OLD.published_status != 'published' OR OLD.published_at IS NULL) THEN
    NEW.published_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_category_stats(category_id uuid)
 RETURNS TABLE(topic_count bigint, post_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH RECURSIVE category_tree AS (
    -- Base case: the category itself
    SELECT id FROM categories WHERE id = category_id
    UNION ALL
    -- Recursive case: all subcategories
    SELECT c.id 
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_category_id = ct.id
  )
  SELECT 
    (SELECT COUNT(*) FROM topics t WHERE t.category_id IN (SELECT id FROM category_tree)) as topic_count,
    (SELECT COUNT(*) FROM posts p 
     INNER JOIN topics t ON p.topic_id = t.id 
     WHERE t.category_id IN (SELECT id FROM category_tree)) as post_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_blog_slug(title_text text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(trim(title_text), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
  
  -- Remove leading/trailing hyphens
  base_slug := trim(base_slug, '-');
  
  -- Ensure unique slug
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.blog_posts WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_bookmarked_topic_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Insert notifications for users who bookmarked this topic
  INSERT INTO public.topic_notifications (user_id, topic_id, post_id, notification_type)
  SELECT 
    tb.user_id,
    NEW.topic_id,
    NEW.id,
    'new_post'
  FROM public.topic_bookmarks tb
  WHERE tb.topic_id = NEW.topic_id
    AND tb.notification_enabled = true
    AND tb.user_id != NEW.author_id; -- Don't notify the author of their own post

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_temp_users()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Delete expired temporary users and their associated data
  DELETE FROM temporary_users 
  WHERE expires_at < now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_temporary_user(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM temporary_users 
    WHERE id = user_id AND expires_at > now()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_peak_daily_visitors(p_count integer, p_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  existing_peak INTEGER;
BEGIN
  -- Get current peak count
  SELECT peak_count INTO existing_peak
  FROM public.peak_daily_visitors_tracking
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no record exists or current count is higher, insert/update
  IF existing_peak IS NULL OR p_count > existing_peak THEN
    INSERT INTO public.peak_daily_visitors_tracking (peak_count, peak_date)
    VALUES (p_count, p_date);
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_anonymous_rate_limit(user_ip inet, session_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  post_count integer;
BEGIN
  -- Count posts in the last 12 hours for this IP/session combination
  SELECT COUNT(*) INTO post_count
  FROM anonymous_post_tracking apt
  WHERE (apt.ip_address = user_ip OR apt.session_id = check_anonymous_rate_limit.session_id)
    AND apt.created_at > (now() - interval '12 hours');
  
  -- Return true if under the limit (5 posts instead of 3)
  RETURN post_count < 5;
END;
$function$;