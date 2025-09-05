-- Ban the remaining spam IP addresses permanently
INSERT INTO public.banned_ips (
  ip_address, 
  ban_type, 
  reason, 
  admin_notes, 
  is_active,
  created_by
) VALUES 
(
  '157.49.125.28'::inet,
  'permanent',
  'Mass spam posting - customer service scam (coordinated attack)',
  'Part of coordinated spam attack - created 11 spam topics with customer service scam content',
  true,
  NULL
),
(
  '146.70.228.163'::inet,
  'permanent', 
  'Mass spam posting - customer service scam (coordinated attack)',
  'Part of coordinated spam attack - created 7 spam topics with customer service scam content',
  true,
  NULL
),
(
  '103.112.16.223'::inet,
  'permanent',
  'Mass spam posting - customer service scam (coordinated attack)', 
  'Part of coordinated spam attack - created 6 spam topics with customer service scam content',
  true,
  NULL
);

-- Reject all topics from these banned IPs
UPDATE public.topics 
SET moderation_status = 'rejected'
WHERE ip_address IN (
  '157.49.125.28'::inet,
  '146.70.228.163'::inet, 
  '103.112.16.223'::inet
)
AND moderation_status != 'rejected';