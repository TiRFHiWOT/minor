-- Drop existing security definer views
DROP VIEW IF EXISTS public.topics_public;
DROP VIEW IF EXISTS public.posts_public;

-- Recreate topics_public view without SECURITY DEFINER
CREATE VIEW public.topics_public AS 
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
FROM topics
WHERE moderation_status = 'approved';

-- Recreate posts_public view without SECURITY DEFINER  
CREATE VIEW public.posts_public AS
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
FROM posts
WHERE moderation_status = 'approved';

-- Enable RLS on the views
ALTER VIEW public.topics_public SET (security_barrier = true);
ALTER VIEW public.posts_public SET (security_barrier = true);

-- Grant appropriate permissions (read-only access)
GRANT SELECT ON public.topics_public TO anon, authenticated;
GRANT SELECT ON public.posts_public TO anon, authenticated;