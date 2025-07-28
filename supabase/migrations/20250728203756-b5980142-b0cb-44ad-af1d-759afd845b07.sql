-- Add support for admin moderation notifications
-- First, add new fields to topic_notifications for reports and appeals
ALTER TABLE public.topic_notifications 
ADD COLUMN report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
ADD COLUMN appeal_id uuid REFERENCES public.moderation_appeals(id) ON DELETE CASCADE;

-- Update notification types to include admin moderation types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_report';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'content_pending'; 
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_appeal';

-- Function to notify all admins
CREATE OR REPLACE FUNCTION notify_all_admins(
  p_notification_type text,
  p_topic_id uuid DEFAULT NULL,
  p_post_id uuid DEFAULT NULL,
  p_report_id uuid DEFAULT NULL,
  p_appeal_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert notifications for all admin users
  INSERT INTO public.topic_notifications (user_id, topic_id, post_id, report_id, appeal_id, notification_type)
  SELECT 
    ur.user_id,
    p_topic_id,
    p_post_id,
    p_report_id,
    p_appeal_id,
    p_notification_type::text
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
END;
$$;

-- Trigger function for new reports
CREATE OR REPLACE FUNCTION notify_admins_new_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM notify_all_admins(
    'new_report',
    NEW.reported_topic_id,
    NEW.reported_post_id,
    NEW.id,
    NULL
  );
  RETURN NEW;
END;
$$;

-- Trigger function for new appeals
CREATE OR REPLACE FUNCTION notify_admins_new_appeal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM notify_all_admins(
    'new_appeal',
    CASE WHEN NEW.content_type = 'topic' THEN NEW.content_id ELSE NULL END,
    CASE WHEN NEW.content_type = 'post' THEN NEW.content_id ELSE NULL END,
    NULL,
    NEW.id
  );
  RETURN NEW;
END;
$$;

-- Trigger function for content pending moderation
CREATE OR REPLACE FUNCTION notify_admins_content_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify if status changed to pending
  IF OLD.moderation_status != 'pending' AND NEW.moderation_status = 'pending' THEN
    PERFORM notify_all_admins(
      'content_pending',
      NEW.id,
      NULL,
      NULL,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function for posts pending moderation
CREATE OR REPLACE FUNCTION notify_admins_post_pending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify if status changed to pending
  IF OLD.moderation_status != 'pending' AND NEW.moderation_status = 'pending' THEN
    PERFORM notify_all_admins(
      'content_pending',
      NEW.topic_id,
      NEW.id,
      NULL,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_admins_new_report ON public.reports;
CREATE TRIGGER trigger_notify_admins_new_report
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_report();

DROP TRIGGER IF EXISTS trigger_notify_admins_new_appeal ON public.moderation_appeals;
CREATE TRIGGER trigger_notify_admins_new_appeal
  AFTER INSERT ON public.moderation_appeals
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_appeal();

DROP TRIGGER IF EXISTS trigger_notify_admins_topic_pending ON public.topics;
CREATE TRIGGER trigger_notify_admins_topic_pending
  BEFORE UPDATE ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_content_pending();

DROP TRIGGER IF EXISTS trigger_notify_admins_post_pending ON public.posts;
CREATE TRIGGER trigger_notify_admins_post_pending
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_post_pending();