-- Security Fix: Restrict IP address visibility to administrators only
-- This prevents attackers from harvesting user IP addresses

-- Drop existing public access policies for posts and topics
DROP POLICY IF EXISTS "Posts content is viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Topics content is viewable by everyone" ON public.topics;

-- Create secure views that exclude IP addresses for public access
CREATE OR REPLACE VIEW public.posts_public AS
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
FROM public.posts
WHERE moderation_status = 'approved';

CREATE OR REPLACE VIEW public.topics_public AS
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
FROM public.topics
WHERE moderation_status = 'approved';

-- Enable RLS on the public views
ALTER VIEW public.posts_public SET (security_barrier = true);
ALTER VIEW public.topics_public SET (security_barrier = true);

-- Create new policies for public access to views only
CREATE POLICY "Public can view approved posts without IP" 
ON public.posts 
FOR SELECT 
TO PUBLIC
USING (
  moderation_status = 'approved' 
  AND auth.uid() IS NULL 
  AND current_setting('request.jwt.claims', true)::json->>'role' != 'authenticated'
);

CREATE POLICY "Authenticated users can view approved posts without admin privileges" 
ON public.posts 
FOR SELECT 
TO authenticated
USING (
  moderation_status = 'approved' 
  AND NOT has_role(auth.uid(), 'admin'::user_role)
  AND NOT has_role(auth.uid(), 'moderator'::user_role)
);

CREATE POLICY "Public can view approved topics without IP" 
ON public.topics 
FOR SELECT 
TO PUBLIC
USING (
  moderation_status = 'approved' 
  AND auth.uid() IS NULL 
  AND current_setting('request.jwt.claims', true)::json->>'role' != 'authenticated'
);

CREATE POLICY "Authenticated users can view approved topics without admin privileges" 
ON public.topics 
FOR SELECT 
TO authenticated
USING (
  moderation_status = 'approved' 
  AND NOT has_role(auth.uid(), 'admin'::user_role)
  AND NOT has_role(auth.uid(), 'moderator'::user_role)
);

-- Update the enriched posts function to be more secure
CREATE OR REPLACE FUNCTION public.get_enriched_posts_secure(p_topic_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  content text,
  author_id uuid,
  topic_id uuid,
  parent_post_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  moderation_status text,
  ip_address text, -- Return as text, will be null for non-admins
  is_anonymous boolean,
  author_username text,
  author_avatar_url text,
  parent_post_content text,
  parent_post_author_username text,
  parent_post_author_avatar_url text,
  parent_post_created_at timestamp with time zone,
  parent_post_moderation_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH post_data AS (
    SELECT 
      p.id, p.content, p.author_id, p.topic_id, p.parent_post_id,
      p.created_at, p.updated_at, p.moderation_status, p.ip_address, p.is_anonymous
    FROM public.posts p
    WHERE p.topic_id = p_topic_id
      AND p.moderation_status = 'approved'
    ORDER BY p.created_at ASC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT 
    pd.id,
    pd.content,
    pd.author_id,
    pd.topic_id,
    pd.parent_post_id,
    pd.created_at,
    pd.updated_at,
    pd.moderation_status,
    -- Only return IP address if user is admin or moderator, otherwise null
    CASE 
      WHEN has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'moderator'::user_role) 
      THEN host(pd.ip_address)
      ELSE NULL
    END::text as ip_address,
    pd.is_anonymous,
    -- Author information
    COALESCE(pr.username, tu.display_name) as author_username,
    pr.avatar_url as author_avatar_url,
    -- Parent post information
    pp.content as parent_post_content,
    COALESCE(ppr.username, ptu.display_name) as parent_post_author_username,
    ppr.avatar_url as parent_post_author_avatar_url,
    pp.created_at as parent_post_created_at,
    pp.moderation_status as parent_post_moderation_status
  FROM post_data pd
  -- Join author data
  LEFT JOIN public.profiles pr ON pd.author_id = pr.id
  LEFT JOIN public.temporary_users tu ON pd.author_id = tu.id
  -- Join parent post data
  LEFT JOIN public.posts pp ON pd.parent_post_id = pp.id
  LEFT JOIN public.profiles ppr ON pp.author_id = ppr.id
  LEFT JOIN public.temporary_users ptu ON pp.author_id = ptu.id
  ORDER BY pd.created_at ASC;
END;
$$;

-- Create a secure function to get topic details
CREATE OR REPLACE FUNCTION public.get_topic_secure(p_topic_id uuid)
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
  ip_address text, -- Return as text, will be null for non-admins
  is_anonymous boolean,
  meta_title text,
  meta_description text,
  meta_keywords text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    -- Only return IP address if user is admin or moderator, otherwise null
    CASE 
      WHEN has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'moderator'::user_role) 
      THEN host(t.ip_address)
      ELSE NULL
    END::text as ip_address,
    t.is_anonymous,
    t.meta_title,
    t.meta_description,
    t.meta_keywords,
    t.canonical_url,
    t.og_title,
    t.og_description,
    t.og_image
  FROM public.topics t
  WHERE t.id = p_topic_id
    AND t.moderation_status = 'approved';
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.posts_public TO anon, authenticated;
GRANT SELECT ON public.topics_public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_enriched_posts_secure TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_topic_secure TO anon, authenticated;