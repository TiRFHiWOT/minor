-- Create topic bookmarks table
CREATE TABLE public.topic_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL,
  notification_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Create topic notifications table
CREATE TABLE public.topic_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL,
  post_id UUID,
  notification_type TEXT NOT NULL DEFAULT 'new_post',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.topic_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for topic_bookmarks
CREATE POLICY "Users can manage their own bookmarks"
ON public.topic_bookmarks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Bookmarks are viewable by everyone"
ON public.topic_bookmarks
FOR SELECT
USING (true);

-- Policies for topic_notifications
CREATE POLICY "Users can view their own notifications"
ON public.topic_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.topic_notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.topic_notifications
FOR INSERT
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_topic_bookmarks_user_id ON public.topic_bookmarks(user_id);
CREATE INDEX idx_topic_bookmarks_topic_id ON public.topic_bookmarks(topic_id);
CREATE INDEX idx_topic_notifications_user_id_unread ON public.topic_notifications(user_id, is_read);
CREATE INDEX idx_topic_notifications_created_at ON public.topic_notifications(created_at DESC);

-- Enable realtime
ALTER TABLE public.topic_bookmarks REPLICA IDENTITY FULL;
ALTER TABLE public.topic_notifications REPLICA IDENTITY FULL;

-- Function to create notifications when posts are added to bookmarked topics
CREATE OR REPLACE FUNCTION public.notify_bookmarked_topic_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert notifications for users who bookmarked this topic
  INSERT INTO public.topic_notifications (user_id, topic_id, post_id, notification_type)
  SELECT 
    tb.user_id,
    NEW.topic_id,
    NEW.id,
    'new_post'
  FROM public.topic_bookmarks tb
  WHERE tb.topic_id = NEW.topic_id
    AND tb.notification_enabled = true
    AND tb.user_id != NEW.author_id; -- Don't notify the author of their own post

  RETURN NEW;
END;
$$;

-- Trigger to create notifications
CREATE TRIGGER notify_bookmarked_topic_activity_trigger
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_bookmarked_topic_activity();

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.topic_notifications
    WHERE user_id = p_user_id AND is_read = false
  );
END;
$$;