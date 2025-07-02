-- Check user status for 85baris@gmail.com
-- Run this in Supabase SQL Editor to debug the sign-in issue

-- 1. Check user details
SELECT 
  id,
  email,
  role,
  is_active,
  created_at,
  updated_at
FROM users
WHERE email = '85baris@gmail.com';

-- 2. Check what role values exist in the enum
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'user_role'::regtype
ORDER BY enumlabel;

-- 3. Check if user_invitations table exists
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_name = 'user_invitations'
) AS invitations_table_exists;

-- 4. Check all users and their roles (to see the distribution)
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC; 