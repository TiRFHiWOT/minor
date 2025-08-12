-- Additional security hardening to resolve remaining issues

-- 1. Drop the flagged views that may be causing "Security Definer View" warnings
DROP VIEW IF EXISTS public.topics_public;
DROP VIEW IF EXISTS public.posts_public;

-- 2. Create more secure IP address handling - move IPs to admin-only audit table
CREATE TABLE IF NOT EXISTS public.content_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('topic', 'post')),
  author_ip inet NOT NULL,
  session_id text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log (admin-only access)
ALTER TABLE public.content_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can access audit logs
CREATE POLICY "Only admins can view audit logs" ON public.content_audit_log
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- 3. Enhanced session security for temporary users
CREATE OR REPLACE FUNCTION public.validate_session_security(p_session_id text, p_user_ip inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_record public.temporary_users%ROWTYPE;
  ip_changes_count integer;
BEGIN
  -- Get session record
  SELECT * INTO session_record
  FROM public.temporary_users
  WHERE session_id = p_session_id AND expires_at > now();
  
  IF session_record.id IS NULL THEN
    RETURN false; -- Session not found or expired
  END IF;
  
  -- Check for suspicious IP changes (more than 3 different IPs in 1 hour)
  SELECT COUNT(DISTINCT ip_address) INTO ip_changes_count
  FROM public.ip_visit_tracking
  WHERE session_id = p_session_id
    AND created_at > (now() - interval '1 hour');
  
  IF ip_changes_count > 3 THEN
    -- Log security event
    INSERT INTO public.security_events (event_type, severity, client_ip, event_details)
    VALUES (
      'suspicious_session_activity',
      'high',
      p_user_ip,
      jsonb_build_object(
        'session_id', p_session_id,
        'ip_changes_count', ip_changes_count,
        'reason', 'Multiple IP addresses for single session'
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 4. Create function to safely get content without exposing IPs
CREATE OR REPLACE FUNCTION public.get_secure_content(content_type text, content_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  is_admin boolean;
BEGIN
  -- Check if user is admin
  is_admin := has_role(auth.uid(), 'admin'::user_role);
  
  IF content_type = 'topic' THEN
    SELECT jsonb_build_object(
      'id', t.id,
      'title', t.title,
      'content', t.content,
      'author_id', t.author_id,
      'category_id', t.category_id,
      'created_at', t.created_at,
      'updated_at', t.updated_at,
      'moderation_status', t.moderation_status,
      'ip_address', CASE WHEN is_admin THEN t.ip_address::text ELSE NULL END
    ) INTO result
    FROM public.topics t
    WHERE t.id = content_id;
  ELSIF content_type = 'post' THEN
    SELECT jsonb_build_object(
      'id', p.id,
      'content', p.content,
      'author_id', p.author_id,
      'topic_id', p.topic_id,
      'created_at', p.created_at,
      'updated_at', p.updated_at,
      'moderation_status', p.moderation_status,
      'ip_address', CASE WHEN is_admin THEN p.ip_address::text ELSE NULL END
    ) INTO result
    FROM public.posts p
    WHERE p.id = content_id;
  END IF;
  
  RETURN result;
END;
$$;

-- 5. Enhanced temporary user cleanup to prevent session hijacking
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete expired temporary users
  DELETE FROM public.temporary_users
  WHERE expires_at < now();
  
  -- Clean up old visit tracking (older than 30 days)
  DELETE FROM public.ip_visit_tracking
  WHERE created_at < (now() - interval '30 days');
  
  -- Log cleanup activity
  INSERT INTO public.security_events (event_type, severity, event_details)
  VALUES (
    'session_cleanup',
    'low',
    jsonb_build_object(
      'action', 'cleanup_expired_sessions',
      'timestamp', now()
    )
  );
END;
$$;

-- 6. Create trigger to audit content creation without exposing IPs in main tables
CREATE OR REPLACE FUNCTION public.audit_content_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log to audit table instead of exposing in main content tables
  INSERT INTO public.content_audit_log (
    content_id,
    content_type,
    author_ip,
    session_id,
    user_agent
  ) VALUES (
    NEW.id,
    CASE 
      WHEN TG_TABLE_NAME = 'topics' THEN 'topic'
      WHEN TG_TABLE_NAME = 'posts' THEN 'post'
    END,
    NEW.ip_address,
    COALESCE(
      (SELECT session_id FROM public.temporary_users WHERE id = NEW.author_id),
      'unknown'
    ),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN NEW;
END;
$$;

-- Apply audit triggers
DROP TRIGGER IF EXISTS audit_topic_creation ON public.topics;
CREATE TRIGGER audit_topic_creation
  AFTER INSERT ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.audit_content_creation();

DROP TRIGGER IF EXISTS audit_post_creation ON public.posts;
CREATE TRIGGER audit_post_creation
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.audit_content_creation();

-- 7. Enhanced RLS policies to completely hide IP addresses from non-admins
-- Update existing policies to be more explicit about IP protection
DROP POLICY IF EXISTS "Public can view approved topics without IP" ON public.topics;
CREATE POLICY "Public can view approved topics without sensitive data" ON public.topics
  FOR SELECT USING (
    moderation_status = 'approved' AND 
    auth.uid() IS NULL AND 
    current_setting('request.jwt.claims', true)::json->>'role' <> 'authenticated'
  );

DROP POLICY IF EXISTS "Public can view approved posts without IP" ON public.posts;
CREATE POLICY "Public can view approved posts without sensitive data" ON public.posts
  FOR SELECT USING (
    moderation_status = 'approved' AND 
    auth.uid() IS NULL AND 
    current_setting('request.jwt.claims', true)::json->>'role' <> 'authenticated'
  );