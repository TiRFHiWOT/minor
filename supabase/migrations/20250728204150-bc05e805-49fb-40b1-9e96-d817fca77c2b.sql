-- Make topic_id nullable for admin notifications that don't relate to specific topics
ALTER TABLE public.topic_notifications 
ALTER COLUMN topic_id DROP NOT NULL;