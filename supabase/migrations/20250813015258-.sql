-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_enriched_posts(uuid, integer, integer);
DROP FUNCTION IF EXISTS public.get_enriched_posts_count(uuid);

-- Create the updated get_enriched_posts function to use posts table instead of forum_posts
CREATE OR REPLACE FUNCTION public.get_enriched_posts(p_topic_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  content text,
  author_id uuid,
  topic_id uuid,
  parent_post_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  moderation_status text,
  is_anonymous boolean,
  author_username text,
  author_avatar_url text,
  parent_post_content text,
  parent_post_created_at timestamp with time zone,
  parent_post_moderation_status text,
  parent_post_author_username text,
  parent_post_author_avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    p.is_anonymous,
    CASE 
      WHEN p.is_anonymous = true OR prof.username IS NULL THEN 
        COALESCE(tu.display_name, 'Guest')
      ELSE prof.username 
    END as author_username,
    CASE 
      WHEN p.is_anonymous = true THEN NULL
      ELSE prof.avatar_url 
    END as author_avatar_url,
    pp.content as parent_post_content,
    pp.created_at as parent_post_created_at,
    pp.moderation_status as parent_post_moderation_status,
    CASE 
      WHEN pp.is_anonymous = true OR pp_prof.username IS NULL THEN 
        COALESCE(pp_tu.display_name, 'Guest')
      ELSE pp_prof.username 
    END as parent_post_author_username,
    CASE 
      WHEN pp.is_anonymous = true THEN NULL
      ELSE pp_prof.avatar_url 
    END as parent_post_author_avatar_url
  FROM public.posts p
  LEFT JOIN public.profiles prof ON p.author_id = prof.id
  LEFT JOIN public.temporary_users tu ON p.author_id = tu.id
  LEFT JOIN public.posts pp ON p.parent_post_id = pp.id
  LEFT JOIN public.profiles pp_prof ON pp.author_id = pp_prof.id
  LEFT JOIN public.temporary_users pp_tu ON pp.author_id = pp_tu.id
  WHERE p.topic_id = p_topic_id
    AND p.moderation_status = 'approved'
  ORDER BY p.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Create the updated get_enriched_posts_count function to use posts table instead of forum_posts
CREATE OR REPLACE FUNCTION public.get_enriched_posts_count(p_topic_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO post_count
  FROM public.posts
  WHERE topic_id = p_topic_id
    AND moderation_status = 'approved';
  
  RETURN post_count;
END;
$$;