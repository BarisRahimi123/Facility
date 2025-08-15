-- Fix master admin role
UPDATE users 
SET user_role = 'master_admin'
WHERE email = '85baris@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  user_role,
  organization_id,
  created_at
FROM users
WHERE email = '85baris@gmail.com'; 