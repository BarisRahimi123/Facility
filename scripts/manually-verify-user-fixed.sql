-- Manually verify a user without email confirmation
-- This only updates email_confirmed_at since confirmed_at is auto-generated

UPDATE auth.users 
SET 
    email_confirmed_at = NOW()
WHERE email = 'bid4wgcc@gmail.com';

-- Check if it worked
SELECT 
    id,
    email, 
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'bid4wgcc@gmail.com'; 