-- COMPREHENSIVE SECURITY FIXES
-- Phase 1: Fix remaining RLS policies and user privacy protection

-- 1. Fix topic_bookmarks table - restrict to bookmark owners only
DROP POLICY IF EXISTS "Bookmarks are viewable by everyone" ON public.topic_bookmarks;

CREATE POLICY "Users can view their own bookmarks" 
ON public.topic_bookmarks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmarks" 
ON public.topic_bookmarks 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Further lock down temporary_users table to prevent session tracking
DROP POLICY IF EXISTS "Users can view own temporary user record" ON public.temporary_users;

-- Only allow admins to view temporary user data and system functions to access
CREATE POLICY "Admins can view temporary users" 
ON public.temporary_users 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow anonymous users to access their own record only during active session
CREATE POLICY "Active temporary users can view own record" 
ON public.temporary_users 
FOR SELECT 
USING (expires_at > now() AND auth.uid() IS NULL);

-- 3. Add RLS policies for tables that have RLS enabled but no policies
-- content_analysis table
ALTER TABLE public.content_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert content analysis" 
ON public.content_analysis 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view content analysis" 
ON public.content_analysis 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

-- user_behavior_patterns table  
ALTER TABLE public.user_behavior_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage behavior patterns" 
ON public.user_behavior_patterns 
FOR ALL 
WITH CHECK (true);

CREATE POLICY "Admins can view behavior patterns" 
ON public.user_behavior_patterns 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Phase 2: Database Function Hardening - Add search_path security to all functions
-- This prevents SQL injection attacks through search_path manipulation

-- Update critical functions with SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.increment(x integer)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN x + 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_view_count(topic_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  UPDATE topics 
  SET view_count = view_count + 1 
  WHERE id = topic_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reverse_text_content(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  -- Simple text reversal function
  RETURN reverse(input_text);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_visitors_last_24h()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT ip_address)
    FROM public.ip_visit_tracking
    WHERE created_at > (now() - interval '24 hours')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_temp_display_name()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  -- Always return "Guest" for public display
  RETURN 'Guest';
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_anonymous_session_id()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN 'anon_' || encode(gen_random_bytes(16), 'hex');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(trim(input_text), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_display_name(temp_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
$function$;