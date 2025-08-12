-- Fix the get_admin_users_with_emails function return type mismatch
-- The function is returning varchar(255) but expects text type

DROP FUNCTION IF EXISTS get_admin_users_with_emails();

CREATE OR REPLACE FUNCTION get_admin_users_with_emails()
RETURNS TABLE(id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Return user emails from auth.users table
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text as email
  FROM auth.users au;
END;
$$;