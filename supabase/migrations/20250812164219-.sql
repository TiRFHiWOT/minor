-- COMPREHENSIVE SECURITY FIXES - Phase 4
-- Fix all remaining database function search_path vulnerabilities

-- Continue with remaining functions
CREATE OR REPLACE FUNCTION public.check_user_rate_limit(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  post_count INTEGER;
BEGIN
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
  
  -- Return true if under the limit (20 posts instead of 3)
  RETURN post_count < 20;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_hot_topics_count()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM topics t
    WHERE t.created_at >= NOW() - INTERVAL '7 days'
      AND t.moderation_status = 'approved'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_topics_total_count(p_category_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF p_category_id IS NULL THEN
    RETURN (
      SELECT COUNT(*)::integer
      FROM topics 
      WHERE moderation_status = 'approved'
    );
  ELSE
    RETURN (
      SELECT COUNT(*)::integer
      FROM topics 
      WHERE category_id = p_category_id 
      AND moderation_status = 'approved'
    );
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.analyze_content_for_spam(content_text text, content_type text DEFAULT 'post'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  content_config jsonb;
  content_hash_var text;
  spam_indicators jsonb := '{}';
  is_spam boolean := false;
  confidence decimal(3,2) := 0.00;
  similar_count integer;
  normalized_content text;
  banned_words_result jsonb;
BEGIN
  -- Get content filtering configuration
  SELECT config_value INTO content_config 
  FROM public.spam_detection_config 
  WHERE config_key = 'content_filters' AND is_active = true;

  -- Normalize content for analysis
  normalized_content := lower(trim(regexp_replace(content_text, '\s+', ' ', 'g')));
  content_hash_var := encode(sha256(normalized_content::bytea), 'hex');

  -- Check banned words first
  banned_words_result := check_banned_words(content_text);
  
  IF (banned_words_result->>'is_blocked')::boolean THEN
    spam_indicators := spam_indicators || jsonb_build_object(
      'banned_words', banned_words_result->'matches',
      'highest_word_severity', banned_words_result->>'highest_severity'
    );
    confidence := confidence + 0.9;
    is_spam := true;
  ELSIF (banned_words_result->>'match_count')::integer > 0 THEN
    spam_indicators := spam_indicators || jsonb_build_object(
      'suspicious_words', banned_words_result->'matches'
    );
    CASE banned_words_result->>'highest_severity'
      WHEN 'moderate' THEN confidence := confidence + 0.6;
      WHEN 'warning' THEN confidence := confidence + 0.3;
    END CASE;
  END IF;

  -- Check minimum content length
  IF length(normalized_content) < COALESCE((content_config->>'min_content_length')::integer, 10) THEN
    spam_indicators := spam_indicators || jsonb_build_object('too_short', true);
    confidence := confidence + 0.3;
  END IF;

  -- Check for Lorem Ipsum patterns
  IF content_config IS NOT NULL AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(content_config->'lorem_ipsum_patterns') AS pattern
    WHERE normalized_content LIKE '%' || pattern || '%'
  ) THEN
    spam_indicators := spam_indicators || jsonb_build_object('lorem_ipsum', true);
    confidence := confidence + 0.8;
    is_spam := true;
  END IF;

  -- Check for spam keywords
  IF content_config IS NOT NULL AND EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(content_config->'spam_keywords') AS keyword
    WHERE normalized_content LIKE '%' || keyword || '%'
  ) THEN
    spam_indicators := spam_indicators || jsonb_build_object('spam_keywords', true);
    confidence := confidence + 0.6;
  END IF;

  -- Check for duplicate content
  SELECT COUNT(*) INTO similar_count
  FROM public.content_analysis ca
  WHERE ca.content_hash = content_hash_var
    AND ca.created_at > (now() - interval '24 hours');

  IF similar_count > 0 THEN
    spam_indicators := spam_indicators || jsonb_build_object('duplicate_content', true, 'duplicate_count', similar_count);
    confidence := confidence + (similar_count * 0.2);
  END IF;

  -- Determine if content is spam
  IF confidence >= 0.7 THEN
    is_spam := true;
  END IF;

  -- Store analysis results
  INSERT INTO public.content_analysis (
    content_hash, content_type, spam_indicators, is_spam, confidence_score
  ) VALUES (
    content_hash_var, content_type, spam_indicators, is_spam, LEAST(confidence, 1.00)
  );

  RETURN jsonb_build_object(
    'is_spam', is_spam,
    'confidence', LEAST(confidence, 1.00),
    'indicators', spam_indicators,
    'content_hash', content_hash_var,
    'banned_words_result', banned_words_result
  );
END;
$function$;