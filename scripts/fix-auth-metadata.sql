-- Fix potential auth metadata issues for 85baris@gmail.com
-- Run this in Supabase SQL Editor

-- 1. First, check if the user exists in auth.users
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE email = '85baris@gmail.com';

-- 2. Get the user ID from the users table
SELECT id FROM users WHERE email = '85baris@gmail.com';

-- 3. If you see the user in both tables above, run this to ensure they're linked:
-- (Replace 'YOUR_AUTH_USER_ID' with the actual ID from step 1)
/*
UPDATE users 
SET id = 'YOUR_AUTH_USER_ID'
WHERE email = '85baris@gmail.com';
*/

-- 4. Alternative: If sign-in still fails, try resetting the password
-- You can do this from Supabase Dashboard -> Authentication -> Users
-- Find the user and click "Send password reset" 