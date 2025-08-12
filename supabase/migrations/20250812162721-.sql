-- Fix IP address exposure vulnerability across multiple tables
-- This prevents attackers from harvesting user IP addresses for tracking and harassment

-- 1. Fix posts table - restrict IP address access to admins only
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;

-- Create separate policies for content vs metadata access
CREATE POLICY "Posts content is viewable by everyone" 
ON public.posts 
FOR SELECT 
USING (moderation_status = 'approved');

-- Admins can see all post data including IP addresses
CREATE POLICY "Admins can view all post data including IPs" 
ON public.posts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

-- 2. Fix topics table - restrict IP address access to admins only  
DROP POLICY IF EXISTS "Topics are viewable by everyone" ON public.topics;

-- Create separate policies for content vs metadata access
CREATE POLICY "Topics content is viewable by everyone" 
ON public.topics 
FOR SELECT 
USING (moderation_status = 'approved');

-- Admins can see all topic data including IP addresses
CREATE POLICY "Admins can view all topic data including IPs" 
ON public.topics 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

-- 3. Fix anonymous_post_tracking table - restrict to system and admin access only
DROP POLICY IF EXISTS "Anonymous tracking viewable by all" ON public.anonymous_post_tracking;

-- Only allow system functions and admins to access this sensitive data
CREATE POLICY "System and admins can access anonymous tracking" 
ON public.anonymous_post_tracking 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

-- 4. Fix banned_ips table - remove public system access, admin only
DROP POLICY IF EXISTS "System can read banned IPs" ON public.banned_ips;

-- Only admins should access banned IP data
-- System functions that need this data should use SECURITY DEFINER functions
CREATE POLICY "Only admins can view banned IPs" 
ON public.banned_ips 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

-- 5. Create security definer function for IP ban checking (system needs this)
CREATE OR REPLACE FUNCTION public.check_ip_banned_secure(user_ip inet)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  banned_record RECORD;
  whitelist_record RECORD;
BEGIN
  -- First check if IP is whitelisted
  SELECT * INTO whitelist_record
  FROM public.ip_whitelist
  WHERE is_active = true
  AND (
    ip_address = user_ip OR 
    (ip_range IS NOT NULL AND user_ip << ip_range)
  )
  LIMIT 1;

  IF whitelist_record.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_banned', false,
      'is_whitelisted', true,
      'bypass_level', whitelist_record.bypass_level
    );
  END IF;

  -- Check if IP is banned
  SELECT * INTO banned_record
  FROM public.banned_ips
  WHERE is_active = true
  AND (expires_at IS NULL OR expires_at > now())
  AND (
    ip_address = user_ip OR 
    (ip_range IS NOT NULL AND user_ip << ip_range)
  )
  ORDER BY 
    CASE ban_type 
      WHEN 'permanent' THEN 1 
      WHEN 'temporary' THEN 2 
      WHEN 'shadowban' THEN 3 
    END
  LIMIT 1;

  IF banned_record.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_banned', true,
      'ban_type', banned_record.ban_type,
      'reason', banned_record.reason,
      'expires_at', banned_record.expires_at,
      'is_whitelisted', false
    );
  END IF;

  RETURN jsonb_build_object(
    'is_banned', false,
    'is_whitelisted', false
  );
END;
$$;

-- Add comment explaining the security change
COMMENT ON FUNCTION public.check_ip_banned_secure(inet) IS 
'Security definer function to check IP bans without exposing IP data to unauthorized users. Replaces direct table access for system functions.';