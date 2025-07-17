-- Create an admin function to get user emails for the admin panel
-- This function will be accessible only to admins and will return user emails from auth.users

CREATE OR REPLACE FUNCTION get_admin_users_with_emails()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Return user data from auth.users for admin users
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;