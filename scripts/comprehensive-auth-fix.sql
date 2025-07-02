-- Comprehensive Auth Fix for 85baris@gmail.com
-- Run this entire script in Supabase SQL Editor

-- Step 1: Check current status
SELECT 
  'Users Table' as source,
  id,
  email,
  role,
  is_active
FROM users
WHERE email = '85baris@gmail.com'

UNION ALL

SELECT 
  'Auth Table' as source,
  id,
  email,
  NULL as role,
  NULL as is_active
FROM auth.users
WHERE email = '85baris@gmail.com';

-- Step 2: Ensure user is active
UPDATE users 
SET is_active = true
WHERE email = '85baris@gmail.com';

-- Step 3: Ensure role is properly set
UPDATE users 
SET role = 'master_admin'
WHERE email = '85baris@gmail.com'
  AND role != 'master_admin';

-- Step 4: If the auth.users ID doesn't match users.id, fix it
DO $$
DECLARE
  auth_id uuid;
  users_id uuid;
BEGIN
  -- Get auth user ID
  SELECT id INTO auth_id 
  FROM auth.users 
  WHERE email = '85baris@gmail.com';
  
  -- Get users table ID
  SELECT id INTO users_id 
  FROM users 
  WHERE email = '85baris@gmail.com';
  
  -- If they don't match, update users table
  IF auth_id IS NOT NULL AND users_id IS NOT NULL AND auth_id != users_id THEN
    UPDATE users 
    SET id = auth_id 
    WHERE email = '85baris@gmail.com';
    
    RAISE NOTICE 'Updated users.id from % to % for 85baris@gmail.com', users_id, auth_id;
  ELSIF auth_id IS NULL THEN
    RAISE NOTICE 'User not found in auth.users - may need to reset password';
  ELSIF users_id IS NULL THEN
    -- Create user in users table if missing
    INSERT INTO users (id, email, role, is_active, created_at, updated_at)
    VALUES (auth_id, '85baris@gmail.com', 'master_admin', true, now(), now())
    ON CONFLICT (email) DO UPDATE 
    SET role = 'master_admin', is_active = true, updated_at = now();
    
    RAISE NOTICE 'Created/updated user in users table';
  ELSE
    RAISE NOTICE 'User IDs already match - no update needed';
  END IF;
END $$;

-- Step 5: Final verification
SELECT 
  u.id as users_id,
  u.email,
  u.role,
  u.is_active,
  au.id as auth_id,
  CASE 
    WHEN u.id = au.id THEN 'IDs Match ✓'
    ELSE 'ID Mismatch ✗'
  END as id_status,
  CASE 
    WHEN u.role = 'master_admin' THEN 'Role Correct ✓'
    ELSE 'Role Incorrect ✗'
  END as role_status
FROM users u
LEFT JOIN auth.users au ON au.email = u.email
WHERE u.email = '85baris@gmail.com'; 