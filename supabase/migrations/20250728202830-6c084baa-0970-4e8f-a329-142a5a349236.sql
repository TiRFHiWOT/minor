-- Add foreign key constraints to topic_notifications table
ALTER TABLE public.topic_notifications 
ADD CONSTRAINT topic_notifications_topic_id_fkey 
FOREIGN KEY (topic_id) REFERENCES public.topics(id) ON DELETE CASCADE;

ALTER TABLE public.topic_notifications 
ADD CONSTRAINT topic_notifications_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;

ALTER TABLE public.topic_notifications 
ADD CONSTRAINT topic_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;