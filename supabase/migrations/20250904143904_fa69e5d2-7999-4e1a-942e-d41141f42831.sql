-- Create function to check new user rate limits
CREATE OR REPLACE FUNCTION public.check_new_user_rate_limit(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_created_at TIMESTAMP WITH TIME ZONE;
  is_new_user BOOLEAN := false;
  post_count INTEGER := 0;
  topic_count INTEGER := 0;
  total_content_count INTEGER := 0;
BEGIN
  -- Get user creation date from auth.users
  SELECT created_at INTO user_created_at
  FROM auth.users 
  WHERE id = user_id;
  
  -- Check if user was created within the last 24 hours
  IF user_created_at IS NOT NULL AND user_created_at > (now() - interval '24 hours') THEN
    is_new_user := true;
    
    -- Count posts created by this user in the last 24 hours
    SELECT COUNT(*) INTO post_count
    FROM posts 
    WHERE author_id = user_id
      AND created_at > (now() - interval '24 hours');
    
    -- Count topics created by this user in the last 24 hours  
    SELECT COUNT(*) INTO topic_count
    FROM topics 
    WHERE author_id = user_id
      AND created_at > (now() - interval '24 hours');
    
    total_content_count := post_count + topic_count;
  END IF;
  
  RETURN jsonb_build_object(
    'is_new_user', is_new_user,
    'user_created_at', user_created_at,
    'post_count_24h', post_count,
    'topic_count_24h', topic_count,
    'total_content_count', total_content_count,
    'is_rate_limited', is_new_user AND total_content_count >= 3,
    'remaining_posts', CASE 
      WHEN is_new_user THEN GREATEST(0, 3 - total_content_count)
      ELSE NULL 
    END,
    'limit_expires_at', CASE 
      WHEN is_new_user THEN user_created_at + interval '24 hours'
      ELSE NULL 
    END
  );
END;
$$;

-- Update the existing rate limit function to include new user checks
CREATE OR REPLACE FUNCTION public.check_user_rate_limit(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_user_check jsonb;
  post_count INTEGER;
BEGIN
  -- First check if this is a new user with stricter limits
  new_user_check := check_new_user_rate_limit(user_id);
  
  -- If user is new and rate limited, return false
  IF (new_user_check->>'is_rate_limited')::boolean = true THEN
    RETURN false;
  END IF;
  
  -- If not a new user or new user under limit, check regular rate limits
  -- Count posts in the last 12 hours for this user
  SELECT COUNT(*) INTO post_count
  FROM (
    SELECT created_at FROM topics 
    WHERE author_id = user_id
      AND created_at > (now() - interval '12 hours')
    UNION ALL
    SELECT created_at FROM posts 
    WHERE author_id = user_id
      AND created_at > (now() - interval '12 hours')
  ) user_posts;
  
  -- Return true if under the regular limit (20 posts)
  RETURN post_count < 20;
END;
$$;