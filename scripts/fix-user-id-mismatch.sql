-- Fix user ID mismatch for 85baris@gmail.com
-- The auth.users ID should be the source of truth

-- First, check the current situation
SELECT 'Current users table entry:' as info;
SELECT id, email, role FROM users WHERE email = '85baris@gmail.com';

-- Update the users table to use the correct auth ID
UPDATE users 
SET id = 'd73d82d8-27f5-4c78-9c4b-978c272069b8'
WHERE email = '85baris@gmail.com';

-- Verify the update
SELECT 'Updated users table entry:' as info;
SELECT id, email, role FROM users WHERE email = '85baris@gmail.com';

-- Note: The auth.users ID (d73d82d8-27f5-4c78-9c4b-978c272069b8) is the correct one
-- This should sync the users table with the auth system 