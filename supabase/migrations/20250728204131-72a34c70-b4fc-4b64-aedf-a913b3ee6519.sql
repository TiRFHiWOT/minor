-- Test the admin notification system by manually creating a notification
-- First, get an admin user ID (replace with actual admin ID when testing)
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the first admin user
  SELECT ur.user_id INTO admin_user_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
  LIMIT 1;
  
  -- Only create test notification if admin exists
  IF admin_user_id IS NOT NULL THEN
    -- Create a test moderation notification
    INSERT INTO public.topic_notifications (
      user_id, 
      notification_type, 
      is_read,
      created_at
    ) VALUES (
      admin_user_id,
      'content_pending'::notification_type,
      false,
      now()
    );
    
    RAISE NOTICE 'Test notification created for admin user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'No admin users found in the system';
  END IF;
END $$;