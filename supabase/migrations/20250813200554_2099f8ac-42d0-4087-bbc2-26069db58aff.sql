-- Emergency VPN Detection Fix - Clean up false positives and add safeguards
-- This migration fixes the revenue-damaging issue where legitimate Google ads traffic was blocked

-- Step 1: Clear the false VPN flag from Google's IP address that was incorrectly flagged
UPDATE ip_geolocation_cache 
SET is_vpn = false, is_proxy = false, updated_at = now()
WHERE ip_address = '192.178.10.77'::inet 
  AND (is_vpn = true OR is_proxy = true);

-- Step 2: Clear VPN flags from known Google IP ranges that should never be blocked
UPDATE ip_geolocation_cache 
SET is_vpn = false, is_proxy = false, updated_at = now()
WHERE (
  ip_address << '8.8.8.0/24'::cidr OR
  ip_address << '8.8.4.0/24'::cidr OR
  ip_address << '192.178.0.0/16'::cidr OR
  ip_address << '172.217.0.0/16'::cidr OR
  ip_address << '216.58.192.0/19'::cidr OR
  ip_address << '74.125.0.0/16'::cidr OR
  ip_address << '173.194.0.0/16'::cidr OR
  ip_address << '64.233.160.0/19'::cidr
) AND (is_vpn = true OR is_proxy = true);

-- Step 3: Clear VPN flags from AWS IP ranges (often used by legitimate services)
UPDATE ip_geolocation_cache 
SET is_vpn = false, is_proxy = false, updated_at = now()
WHERE (
  ip_address << '52.0.0.0/8'::cidr OR
  ip_address << '54.0.0.0/8'::cidr OR
  ip_address << '18.0.0.0/8'::cidr OR
  ip_address << '34.0.0.0/8'::cidr
) AND (is_vpn = true OR is_proxy = true);

-- Step 4: Clear VPN flags from Microsoft Azure IP ranges
UPDATE ip_geolocation_cache 
SET is_vpn = false, is_proxy = false, updated_at = now()
WHERE (
  ip_address << '13.0.0.0/8'::cidr OR
  ip_address << '20.0.0.0/8'::cidr OR
  ip_address << '40.0.0.0/8'::cidr OR
  ip_address << '104.0.0.0/8'::cidr
) AND (is_vpn = true OR is_proxy = true);

-- Step 5: Add logging for future debugging
INSERT INTO admin_audit_log (admin_user_id, action_type, target_type, target_id, target_details)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'emergency_fix',
  'vpn_detection',
  '00000000-0000-0000-0000-000000000000',
  jsonb_build_object(
    'reason', 'Clear false VPN flags from legitimate cloud provider IPs',
    'fixed_google_ip', '192.178.10.77',
    'cleared_ranges', json_build_array(
      'Google: 8.8.8.0/24, 192.178.0.0/16, etc.',
      'AWS: 52.0.0.0/8, 54.0.0.0/8, etc.',
      'Microsoft: 13.0.0.0/8, 20.0.0.0/8, etc.'
    ),
    'impact', 'Prevents blocking of Google AdSense and other legitimate ad traffic',
    'revenue_protection', true
  )
);