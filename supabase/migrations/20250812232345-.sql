-- Fix critical security issues

-- 1. Fix user_roles table RLS policy to prevent exposure of role information
DROP POLICY IF EXISTS "Anyone can view user roles" ON user_roles;

CREATE POLICY "Users can view own roles only" 
ON user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- 2. Update database functions to include proper search_path for security
-- Fix the has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix the is_temporary_user function  
CREATE OR REPLACE FUNCTION public.is_temporary_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.temporary_users
    WHERE id = _user_id
      AND expires_at > now()
  )
$$;

-- 3. Add role validation trigger to prevent unauthorized role assignments
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow admins to assign admin or moderator roles
  IF NEW.role IN ('admin', 'moderator') THEN
    IF NOT has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only administrators can assign admin or moderator roles';
    END IF;
  END IF;
  
  -- Prevent users from assigning roles to other users (except admins)
  IF NEW.user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Users can only manage their own roles';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for role validation
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON user_roles;
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION validate_role_assignment();

-- 4. Add security logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_severity text DEFAULT 'medium',
  p_event_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO security_events (
    event_type,
    severity,
    event_details,
    client_ip,
    user_agent
  ) VALUES (
    p_event_type,
    p_severity,
    p_event_details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$$;