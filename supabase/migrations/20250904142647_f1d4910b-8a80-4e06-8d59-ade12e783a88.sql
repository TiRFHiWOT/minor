-- Add banned words for customer service scams
INSERT INTO public.banned_words (word_pattern, match_type, severity, action, category, replacement_text) VALUES
('customer service', 'partial', 'ban', 'block', 'scam', NULL),
('technical support', 'partial', 'ban', 'block', 'scam', NULL),
('contact number', 'partial', 'ban', 'block', 'scam', NULL),
('live agent', 'partial', 'ban', 'block', 'scam', NULL),
('24/7 support', 'partial', 'ban', 'block', 'scam', NULL),
('call now', 'partial', 'ban', 'block', 'scam', NULL),
('toll free', 'partial', 'ban', 'block', 'scam', NULL),
('helpline', 'exact', 'ban', 'block', 'scam', NULL),
('help desk', 'partial', 'ban', 'block', 'scam', NULL),
('instant help', 'partial', 'ban', 'block', 'scam', NULL),
('get help', 'partial', 'moderate', 'replace', 'scam', 'contact support'),
('aol support', 'partial', 'ban', 'block', 'scam', NULL),
('gmail support', 'partial', 'ban', 'block', 'scam', NULL),
('yahoo support', 'partial', 'ban', 'block', 'scam', NULL),
('outlook support', 'partial', 'ban', 'block', 'scam', NULL);

-- Create function to analyze content for spam patterns
CREATE OR REPLACE FUNCTION public.analyze_content_for_spam(content_text text, content_type text DEFAULT 'post')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  spam_score NUMERIC := 0;
  indicators jsonb := '{}';
  banned_check jsonb;
  confidence NUMERIC;
BEGIN
  -- Check banned words first
  banned_check := check_banned_words(content_text);
  
  IF (banned_check->>'is_blocked')::boolean THEN
    RETURN jsonb_build_object(
      'is_spam', true,
      'confidence', 1.0,
      'indicators', jsonb_build_object(
        'banned_words', banned_check->'matches',
        'reason', 'Contains banned words'
      )
    );
  END IF;

  -- Check for customer service scam patterns
  IF content_text ~* '(customer|technical|support|service|help).*?(number|phone|call|contact)' THEN
    spam_score := spam_score + 0.8;
    indicators := indicators || jsonb_build_object('customer_service_pattern', true);
  END IF;

  -- Check for multiple phone number patterns
  IF (length(content_text) - length(regexp_replace(content_text, '\d{3}[-.\s]?\d{3}[-.\s]?\d{4}', '', 'g'))) > 10 THEN
    spam_score := spam_score + 0.6;
    indicators := indicators || jsonb_build_object('multiple_phone_numbers', true);
  END IF;

  -- Check for excessive contact keywords
  IF (SELECT count(*) FROM unnest(string_to_array(lower(content_text), ' ')) WHERE unnest ~ '(call|phone|contact|help|support|service)') >= 5 THEN
    spam_score := spam_score + 0.5;
    indicators := indicators || jsonb_build_object('excessive_contact_keywords', true);
  END IF;

  -- Check for urgency/scam language
  IF content_text ~* '(urgent|immediate|instant|24/?7|now|today|asap)' THEN
    spam_score := spam_score + 0.3;
    indicators := indicators || jsonb_build_object('urgency_language', true);
  END IF;

  -- Check for repetitive titles (similar to existing spam)
  IF EXISTS (
    SELECT 1 FROM topics t 
    WHERE t.created_at > NOW() - INTERVAL '1 hour'
    AND similarity(lower(t.title), lower(content_text)) > 0.7
    AND t.id != COALESCE((SELECT id FROM topics WHERE content = content_text LIMIT 1), gen_random_uuid())
  ) THEN
    spam_score := spam_score + 0.7;
    indicators := indicators || jsonb_build_object('repetitive_content', true);
  END IF;

  confidence := LEAST(spam_score, 1.0);
  
  RETURN jsonb_build_object(
    'is_spam', confidence >= 0.7,
    'confidence', confidence,
    'indicators', indicators
  );
END;
$$;

-- Ban the current spam user
INSERT INTO public.banned_ips (ip_address, ban_type, reason, admin_notes)
SELECT DISTINCT t.ip_address, 'permanent', 'Mass spam posting - customer service scam', 'Automated ban for posting 50+ spam topics'
FROM topics t 
WHERE t.author_id = '7e85f7a3-5d55-4614-bb17-54c3ed6090b9'
LIMIT 1;

-- Update user role to banned
UPDATE public.user_roles 
SET role = 'banned'
WHERE user_id = '7e85f7a3-5d55-4614-bb17-54c3ed6090b9';

-- Set all spam topics to rejected status
UPDATE public.topics 
SET moderation_status = 'rejected'
WHERE author_id = '7e85f7a3-5d55-4614-bb17-54c3ed6090b9';