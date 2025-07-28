-- Add foreign key constraints to topic_bookmarks table for proper data integrity

-- Add foreign key constraint from topic_bookmarks.topic_id to topics.id
ALTER TABLE public.topic_bookmarks 
ADD CONSTRAINT fk_topic_bookmarks_topic_id 
FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;

-- Add foreign key constraint from topic_bookmarks.user_id to profiles.id  
ALTER TABLE public.topic_bookmarks 
ADD CONSTRAINT fk_topic_bookmarks_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Create indexes for better performance on foreign key columns
CREATE INDEX IF NOT EXISTS idx_topic_bookmarks_topic_id ON public.topic_bookmarks(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_bookmarks_user_id ON public.topic_bookmarks(user_id);