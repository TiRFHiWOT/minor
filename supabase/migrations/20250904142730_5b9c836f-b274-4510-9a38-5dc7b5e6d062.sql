-- Add banned words for customer service scams with proper category
INSERT INTO public.banned_words (word_pattern, match_type, severity, action, category, replacement_text) VALUES
('customer service', 'partial', 'ban', 'block', 'spam', NULL),
('technical support', 'partial', 'ban', 'block', 'spam', NULL),
('contact number', 'partial', 'ban', 'block', 'spam', NULL),
('live agent', 'partial', 'ban', 'block', 'spam', NULL),
('24/7 support', 'partial', 'ban', 'block', 'spam', NULL),
('call now', 'partial', 'ban', 'block', 'spam', NULL),
('toll free', 'partial', 'ban', 'block', 'spam', NULL),
('helpline', 'exact', 'ban', 'block', 'spam', NULL),
('help desk', 'partial', 'ban', 'block', 'spam', NULL),
('instant help', 'partial', 'ban', 'block', 'spam', NULL),
('aol support', 'partial', 'ban', 'block', 'spam', NULL),
('gmail support', 'partial', 'ban', 'block', 'spam', NULL),
('yahoo support', 'partial', 'ban', 'block', 'spam', NULL),
('outlook support', 'partial', 'ban', 'block', 'spam', NULL);

-- Improve the spam detection function
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
    spam_score := spam_score + 0.9;
    indicators := indicators || jsonb_build_object('customer_service_pattern', true);
  END IF;

  -- Check for excessive contact keywords
  IF (SELECT count(*) FROM unnest(string_to_array(lower(content_text), ' ')) WHERE unnest ~ '(call|phone|contact|help|support|service)') >= 3 THEN
    spam_score := spam_score + 0.6;
    indicators := indicators || jsonb_build_object('excessive_contact_keywords', true);
  END IF;

  -- Check for urgency/scam language
  IF content_text ~* '(urgent|immediate|instant|24/?7|now|today|asap)' THEN
    spam_score := spam_score + 0.4;
    indicators := indicators || jsonb_build_object('urgency_language', true);
  END IF;

  -- Check for repetitive titles (similar spam posts)
  IF EXISTS (
    SELECT 1 FROM topics t 
    WHERE t.created_at > NOW() - INTERVAL '2 hours'
    AND similarity(lower(t.title), lower(content_text)) > 0.6
    LIMIT 1
  ) THEN
    spam_score := spam_score + 0.8;
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

-- Ban the spam user's IP permanently  
INSERT INTO public.banned_ips (ip_address, ban_type, reason, admin_notes)
SELECT DISTINCT t.ip_address, 'permanent', 'Mass spam posting - customer service scam', 'Automated ban for posting 50+ spam topics in 1 hour'
FROM topics t 
WHERE t.author_id = '7e85f7a3-5d55-4614-bb17-54c3ed6090b9'
LIMIT 1;

-- Set all spam topics to rejected status
UPDATE public.topics 
SET moderation_status = 'rejected'
WHERE author_id = '7e85f7a3-5d55-4614-bb17-54c3ed6090b9';