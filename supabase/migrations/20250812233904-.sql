-- Final IP security fix - remove views and use only functions

-- 1. Drop the security definer views that are being flagged
DROP VIEW IF EXISTS public.topics_secure;
DROP VIEW IF EXISTS public.posts_secure;

-- 2. Create a completely separate IP-free content system
-- First, let's create new tables that mirror content without IP addresses
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  author_id uuid,
  category_id uuid NOT NULL,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  view_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  last_reply_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  slug text NOT NULL,
  moderation_status text DEFAULT 'approved',
  is_anonymous boolean DEFAULT false,
  meta_title text,
  meta_description text,
  meta_keywords text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text
);

CREATE TABLE IF NOT EXISTS public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  author_id uuid,
  topic_id uuid NOT NULL,
  parent_post_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  moderation_status text DEFAULT 'approved',
  is_anonymous boolean DEFAULT false
);

-- Enable RLS on the new tables
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Create public access policies for the new tables
CREATE POLICY "Anyone can view approved forum topics" ON public.forum_topics
  FOR SELECT USING (moderation_status = 'approved');

CREATE POLICY "Anyone can view approved forum posts" ON public.forum_posts
  FOR SELECT USING (moderation_status = 'approved');

CREATE POLICY "Authenticated users can create forum topics" ON public.forum_topics
  FOR INSERT WITH CHECK (auth.uid() = author_id OR auth.uid() IS NULL);

CREATE POLICY "Authenticated users can create forum posts" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id OR auth.uid() IS NULL);

CREATE POLICY "Authors can update their forum topics" ON public.forum_topics
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can update their forum posts" ON public.forum_posts
  FOR UPDATE USING (auth.uid() = author_id);

-- Create triggers to sync data from main tables to IP-free tables
CREATE OR REPLACE FUNCTION public.sync_topic_to_forum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.forum_topics (
      id, title, content, author_id, category_id, is_pinned, is_locked,
      view_count, reply_count, last_reply_at, created_at, updated_at,
      slug, moderation_status, is_anonymous, meta_title, meta_description,
      meta_keywords, canonical_url, og_title, og_description, og_image
    ) VALUES (
      NEW.id, NEW.title, NEW.content, NEW.author_id, NEW.category_id,
      NEW.is_pinned, NEW.is_locked, NEW.view_count, NEW.reply_count,
      NEW.last_reply_at, NEW.created_at, NEW.updated_at, NEW.slug,
      NEW.moderation_status, NEW.is_anonymous, NEW.meta_title,
      NEW.meta_description, NEW.meta_keywords, NEW.canonical_url,
      NEW.og_title, NEW.og_description, NEW.og_image
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.forum_topics SET
      title = NEW.title,
      content = NEW.content,
      author_id = NEW.author_id,
      category_id = NEW.category_id,
      is_pinned = NEW.is_pinned,
      is_locked = NEW.is_locked,
      view_count = NEW.view_count,
      reply_count = NEW.reply_count,
      last_reply_at = NEW.last_reply_at,
      updated_at = NEW.updated_at,
      slug = NEW.slug,
      moderation_status = NEW.moderation_status,
      is_anonymous = NEW.is_anonymous,
      meta_title = NEW.meta_title,
      meta_description = NEW.meta_description,
      meta_keywords = NEW.meta_keywords,
      canonical_url = NEW.canonical_url,
      og_title = NEW.og_title,
      og_description = NEW.og_description,
      og_image = NEW.og_image
    WHERE id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.forum_topics WHERE id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_post_to_forum()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.forum_posts (
      id, content, author_id, topic_id, parent_post_id,
      created_at, updated_at, moderation_status, is_anonymous
    ) VALUES (
      NEW.id, NEW.content, NEW.author_id, NEW.topic_id,
      NEW.parent_post_id, NEW.created_at, NEW.updated_at,
      NEW.moderation_status, NEW.is_anonymous
    );
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.forum_posts SET
      content = NEW.content,
      author_id = NEW.author_id,
      topic_id = NEW.topic_id,
      parent_post_id = NEW.parent_post_id,
      updated_at = NEW.updated_at,
      moderation_status = NEW.moderation_status,
      is_anonymous = NEW.is_anonymous
    WHERE id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.forum_posts WHERE id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS sync_topic_to_forum_trigger ON public.topics;
CREATE TRIGGER sync_topic_to_forum_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.sync_topic_to_forum();

DROP TRIGGER IF EXISTS sync_post_to_forum_trigger ON public.posts;
CREATE TRIGGER sync_post_to_forum_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_to_forum();

-- Sync existing data to the new tables
INSERT INTO public.forum_topics (
  id, title, content, author_id, category_id, is_pinned, is_locked,
  view_count, reply_count, last_reply_at, created_at, updated_at,
  slug, moderation_status, is_anonymous, meta_title, meta_description,
  meta_keywords, canonical_url, og_title, og_description, og_image
)
SELECT 
  id, title, content, author_id, category_id, is_pinned, is_locked,
  view_count, reply_count, last_reply_at, created_at, updated_at,
  slug, moderation_status, is_anonymous, meta_title, meta_description,
  meta_keywords, canonical_url, og_title, og_description, og_image
FROM public.topics
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.forum_posts (
  id, content, author_id, topic_id, parent_post_id,
  created_at, updated_at, moderation_status, is_anonymous
)
SELECT 
  id, content, author_id, topic_id, parent_post_id,
  created_at, updated_at, moderation_status, is_anonymous
FROM public.posts
ON CONFLICT (id) DO NOTHING;

-- Grant permissions
GRANT SELECT ON public.forum_topics TO anon, authenticated;
GRANT SELECT ON public.forum_posts TO anon, authenticated;
GRANT INSERT ON public.forum_topics TO authenticated;
GRANT INSERT ON public.forum_posts TO authenticated;
GRANT UPDATE ON public.forum_topics TO authenticated;
GRANT UPDATE ON public.forum_posts TO authenticated;

-- Update the restrictive policies on main tables to be admin-only
DROP POLICY IF EXISTS "Only admins and secure functions can access topics" ON public.topics;
DROP POLICY IF EXISTS "Only admins and secure functions can access posts" ON public.posts;

CREATE POLICY "Only admins can access topics table" ON public.topics
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Only admins can access posts table" ON public.posts
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));