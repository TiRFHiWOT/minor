-- Create notifications for existing pending reports that should alert admins
-- This will generate notifications for all current pending reports

-- First, notify admins about existing pending reports
INSERT INTO public.topic_notifications (user_id, report_id, notification_type, is_read, created_at)
SELECT 
  ur.user_id,
  r.id,
  'new_report'::notification_type,
  false,
  r.created_at
FROM public.reports r
CROSS JOIN public.user_roles ur
WHERE r.status = 'pending'
  AND ur.role = 'admin'
  AND NOT EXISTS (
    -- Don't create duplicates
    SELECT 1 FROM public.topic_notifications tn 
    WHERE tn.report_id = r.id AND tn.user_id = ur.user_id
  );

-- Also notify about any existing pending appeals
INSERT INTO public.topic_notifications (user_id, appeal_id, notification_type, is_read, created_at)
SELECT 
  ur.user_id,
  ma.id,
  'new_appeal'::notification_type,
  false,
  ma.created_at
FROM public.moderation_appeals ma
CROSS JOIN public.user_roles ur
WHERE ma.status = 'pending'
  AND ur.role = 'admin'
  AND NOT EXISTS (
    -- Don't create duplicates
    SELECT 1 FROM public.topic_notifications tn 
    WHERE tn.appeal_id = ma.id AND tn.user_id = ur.user_id
  );

-- Notify about any content currently pending moderation
INSERT INTO public.topic_notifications (user_id, topic_id, notification_type, is_read, created_at)
SELECT 
  ur.user_id,
  t.id,
  'content_pending'::notification_type,
  false,
  t.updated_at
FROM public.topics t
CROSS JOIN public.user_roles ur
WHERE t.moderation_status = 'pending'
  AND ur.role = 'admin'
  AND NOT EXISTS (
    -- Don't create duplicates for topic content pending
    SELECT 1 FROM public.topic_notifications tn 
    WHERE tn.topic_id = t.id AND tn.user_id = ur.user_id AND tn.notification_type = 'content_pending'
  );

-- Notify about any posts currently pending moderation
INSERT INTO public.topic_notifications (user_id, topic_id, post_id, notification_type, is_read, created_at)
SELECT 
  ur.user_id,
  p.topic_id,
  p.id,
  'content_pending'::notification_type,
  false,
  p.updated_at
FROM public.posts p
CROSS JOIN public.user_roles ur
WHERE p.moderation_status = 'pending'
  AND ur.role = 'admin'
  AND NOT EXISTS (
    -- Don't create duplicates for post content pending
    SELECT 1 FROM public.topic_notifications tn 
    WHERE tn.post_id = p.id AND tn.user_id = ur.user_id AND tn.notification_type = 'content_pending'
  );