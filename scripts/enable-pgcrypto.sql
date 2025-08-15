-- Enable pgcrypto extension for gen_random_bytes function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify the extension is enabled
SELECT 
  extname,
  extversion
FROM pg_extension 
WHERE extname = 'pgcrypto';

-- Test the function
SELECT encode(gen_random_bytes(32), 'hex') as test_token; 