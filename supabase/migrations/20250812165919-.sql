-- Harden data exposure: prevent public SELECT on posts/topics (to hide ip_address)
-- Strategy: drop public SELECT policies and restrict base-table SELECT to admin/moderator only.

-- 1) Posts: remove public SELECT policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'posts' AND policyname = 'Posts content is viewable by everyone'
  ) THEN
    EXECUTE 'DROP POLICY "Posts content is viewable by everyone" ON public.posts';
  END IF;
END $$;

-- Ensure admins/moderators can still SELECT from base table when needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'posts' AND policyname = 'Moderators can view posts'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Moderators can view posts"
      ON public.posts
      FOR SELECT
      USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'moderator'::user_role));
    $$;
  END IF;
END $$;

-- 2) Topics: remove public SELECT policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'topics' AND policyname = 'Topics content is viewable by everyone'
  ) THEN
    EXECUTE 'DROP POLICY "Topics content is viewable by everyone" ON public.topics';
  END IF;
END $$;

-- Ensure admins/moderators can still SELECT from base table when needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'topics' AND policyname = 'Moderators can view topics'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Moderators can view topics"
      ON public.topics
      FOR SELECT
      USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'moderator'::user_role));
    $$;
  END IF;
END $$;

-- Note: Public reads should use SECURITY DEFINER RPCs (e.g., get_enriched_posts / get_enriched_topics)
-- which already redact ip_address for non-admins.