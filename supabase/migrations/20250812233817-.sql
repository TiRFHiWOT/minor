-- Complete IP address security fix - remove IP columns from public content access

-- 1. Create completely secure views that exclude IP addresses entirely
CREATE OR REPLACE VIEW public.topics_secure AS
SELECT 
  id,
  title,
  content,
  author_id,
  category_id,
  is_pinned,
  is_locked,
  view_count,
  reply_count,
  last_reply_at,
  created_at,
  updated_at,
  slug,
  moderation_status,
  is_anonymous,
  meta_title,
  meta_description,
  meta_keywords,
  canonical_url,
  og_title,
  og_description,
  og_image
FROM public.topics;

CREATE OR REPLACE VIEW public.posts_secure AS
SELECT 
  id,
  content,
  author_id,
  topic_id,
  parent_post_id,
  created_at,
  updated_at,
  moderation_status,
  is_anonymous
FROM public.posts;

-- 2. Create secure RLS policies for the views
ALTER VIEW public.topics_secure SET (security_barrier = true);
ALTER VIEW public.posts_secure SET (security_barrier = true);

-- 3. Update RLS policies to be more restrictive about IP access
-- Drop existing policies that might still expose IPs
DROP POLICY IF EXISTS "Admins can view all topic data including IPs" ON public.topics;
DROP POLICY IF EXISTS "Admins can view all post data including IPs" ON public.posts;

-- Create new admin policies that explicitly control IP access
CREATE POLICY "Admins can view complete topic data" ON public.topics
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::user_role)
  );

CREATE POLICY "Admins can view complete post data" ON public.posts
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::user_role)
  );

-- 4. Create function to securely access content without IPs for non-admins
CREATE OR REPLACE FUNCTION public.get_topics_without_ip(
  p_category_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  author_id uuid,
  category_id uuid,
  is_pinned boolean,
  is_locked boolean,
  view_count integer,
  reply_count integer,
  last_reply_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  slug text,
  moderation_status text,
  is_anonymous boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.content,
    t.author_id,
    t.category_id,
    t.is_pinned,
    t.is_locked,
    t.view_count,
    t.reply_count,
    t.last_reply_at,
    t.created_at,
    t.updated_at,
    t.slug,
    t.moderation_status,
    t.is_anonymous
  FROM public.topics t
  WHERE t.moderation_status = 'approved'
    AND (p_category_id IS NULL OR t.category_id = p_category_id)
  ORDER BY t.is_pinned DESC, t.last_reply_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_posts_without_ip(
  p_topic_id uuid,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  content text,
  author_id uuid,
  topic_id uuid,
  parent_post_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  moderation_status text,
  is_anonymous boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    p.author_id,
    p.topic_id,
    p.parent_post_id,
    p.created_at,
    p.updated_at,
    p.moderation_status,
    p.is_anonymous
  FROM public.posts p
  WHERE p.topic_id = p_topic_id
    AND p.moderation_status = 'approved'
  ORDER BY p.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 5. Create IP-safe content creation functions
CREATE OR REPLACE FUNCTION public.create_topic_secure(
  p_title text,
  p_content text,
  p_category_id uuid,
  p_author_id uuid,
  p_author_ip inet,
  p_slug text DEFAULT NULL,
  p_is_anonymous boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_topic_id uuid;
  generated_slug text;
BEGIN
  -- Generate slug if not provided
  IF p_slug IS NULL THEN
    generated_slug := generate_slug(p_title);
  ELSE
    generated_slug := p_slug;
  END IF;
  
  -- Insert topic with IP address
  INSERT INTO public.topics (
    title, content, category_id, author_id, ip_address, slug, is_anonymous
  ) VALUES (
    p_title, p_content, p_category_id, p_author_id, p_author_ip, generated_slug, p_is_anonymous
  ) RETURNING id INTO new_topic_id;
  
  -- Log to audit table (IP stored separately)
  INSERT INTO public.content_audit_log (
    content_id, content_type, author_ip, session_id
  ) VALUES (
    new_topic_id, 'topic', p_author_ip, 
    COALESCE((SELECT session_id FROM public.temporary_users WHERE id = p_author_id), 'unknown')
  );
  
  RETURN new_topic_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_post_secure(
  p_content text,
  p_topic_id uuid,
  p_author_id uuid,
  p_author_ip inet,
  p_parent_post_id uuid DEFAULT NULL,
  p_is_anonymous boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_post_id uuid;
BEGIN
  -- Insert post with IP address
  INSERT INTO public.posts (
    content, topic_id, author_id, ip_address, parent_post_id, is_anonymous
  ) VALUES (
    p_content, p_topic_id, p_author_id, p_author_ip, p_parent_post_id, p_is_anonymous
  ) RETURNING id INTO new_post_id;
  
  -- Log to audit table (IP stored separately)
  INSERT INTO public.content_audit_log (
    content_id, content_type, author_ip, session_id
  ) VALUES (
    new_post_id, 'post', p_author_ip,
    COALESCE((SELECT session_id FROM public.temporary_users WHERE id = p_author_id), 'unknown')
  );
  
  -- Update topic reply count and last reply time
  UPDATE public.topics 
  SET 
    reply_count = reply_count + 1,
    last_reply_at = now()
  WHERE id = p_topic_id;
  
  RETURN new_post_id;
END;
$$;

-- 6. Revoke direct access to main tables for non-admins and use functions instead
-- Update policies to be even more restrictive
DROP POLICY IF EXISTS "Authenticated users can view approved topics without admin priv" ON public.topics;
DROP POLICY IF EXISTS "Public can view approved topics without sensitive data" ON public.topics;
DROP POLICY IF EXISTS "Authenticated users can view approved posts without admin privi" ON public.posts;
DROP POLICY IF EXISTS "Public can view approved posts without sensitive data" ON public.posts;

-- Create new restrictive policies that prevent any IP exposure
CREATE POLICY "Only admins and secure functions can access topics" ON public.topics
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    current_setting('role', true) = 'service_role'
  );

CREATE POLICY "Only admins and secure functions can access posts" ON public.posts
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    current_setting('role', true) = 'service_role'
  );

-- 7. Grant access to secure views for public use
GRANT SELECT ON public.topics_secure TO anon, authenticated;
GRANT SELECT ON public.posts_secure TO anon, authenticated;

-- Grant execute permissions on secure functions
GRANT EXECUTE ON FUNCTION public.get_topics_without_ip TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_posts_without_ip TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_topic_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_post_secure TO authenticated;