-- Fix remaining database security issues

-- Update all remaining SECURITY DEFINER functions to include search_path
CREATE OR REPLACE FUNCTION public.increment_view_count(topic_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE topics 
  SET view_count = view_count + 1 
  WHERE id = topic_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_visitors_last_24h()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT ip_address)
    FROM public.ip_visit_tracking
    WHERE created_at > (now() - interval '24 hours')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_display_name(temp_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  guest_num INTEGER;
BEGIN
  SELECT guest_number INTO guest_num
  FROM public.temporary_users
  WHERE id = temp_user_id;
  
  IF guest_num IS NOT NULL THEN
    RETURN 'Guest #' || guest_num;
  ELSE
    RETURN 'Guest';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_users_with_emails()
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Return user emails from auth.users table
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text as email
  FROM auth.users au;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_user_rate_limit(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  post_count INTEGER;
BEGIN
  -- Count posts in the last 12 hours for this user
  SELECT COUNT(*) INTO post_count
  FROM (
    SELECT created_at FROM topics 
    WHERE author_id = user_id
      AND created_at > (now() - interval '12 hours')
    UNION ALL
    SELECT created_at FROM posts 
    WHERE author_id = user_id
      AND created_at > (now() - interval '12 hours')
  ) user_posts;
  
  -- Return true if under the limit (20 posts instead of 3)
  RETURN post_count < 20;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_poll_results(poll_id_param uuid)
RETURNS TABLE(option_id uuid, option_text text, display_order integer, vote_count bigint, percentage numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Add more secure RLS policies for sensitive tables
CREATE POLICY "Admin audit log viewable by admins only"
ON admin_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Ensure proper security logging is enabled
SELECT log_security_event('security_hardening_complete', 'info', 
  jsonb_build_object(
    'timestamp', now(),
    'action', 'database_security_functions_updated',
    'functions_secured', 6
  )
);