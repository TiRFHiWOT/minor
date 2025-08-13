-- Add missing foreign key constraints to forum_topics and forum_posts tables
-- that were present in the original topics/posts tables

-- Add foreign key from forum_topics to categories
ALTER TABLE public.forum_topics 
ADD CONSTRAINT forum_topics_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.categories(id);

-- Add foreign key from forum_posts to forum_topics  
ALTER TABLE public.forum_posts 
ADD CONSTRAINT forum_posts_topic_id_fkey 
FOREIGN KEY (topic_id) REFERENCES public.forum_topics(id) ON DELETE CASCADE;

-- Add foreign key from forum_posts to itself for parent_post_id
ALTER TABLE public.forum_posts 
ADD CONSTRAINT forum_posts_parent_post_id_fkey 
FOREIGN KEY (parent_post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;