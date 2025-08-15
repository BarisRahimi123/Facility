-- Manually verify a user without email confirmation
-- Replace 'bid4wgcc@gmail.com' with the email you want to verify

UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'bid4wgcc@gmail.com';

-- Check if it worked
SELECT id, email, email_confirmed_at, confirmed_at 
FROM auth.users 
WHERE email = 'bid4wgcc@gmail.com'; 