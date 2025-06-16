INSERT INTO form_tokens (
  token,
  status,
  metadata,
  created_at,
  updated_at,
  expires_at
) VALUES (
  '26592d3d5252b81356c48e30639dd3b766655042471b30997e7cbcc7ad0c8745',
  'active',
  '{"system": "HVAC", "location": "Building A"}'::jsonb,
  NOW(),
  NOW(),
  NOW() + INTERVAL '7 days'
)
ON CONFLICT (token) DO UPDATE SET
  status = 'active',
  metadata = '{"system": "HVAC", "location": "Building A"}'::jsonb,
  updated_at = NOW(),
  expires_at = NOW() + INTERVAL '7 days'; 