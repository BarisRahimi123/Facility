-- Check if the user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = '85baris@gmail.com';

-- Check if the user exists in public.users table
SELECT id, email, full_name, role, is_active 
FROM users 
WHERE email = '85baris@gmail.com';

-- If the user exists in auth but not in users table, create the record
INSERT INTO users (id, email, full_name, role, is_active)
SELECT 
  auth.users.id,
  '85baris@gmail.com',
  'Master Admin',
  'master_admin',
  true
FROM auth.users 
WHERE auth.users.email = '85baris@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM users WHERE email = '85baris@gmail.com'
);

-- Update the user's role to master_admin if they exist
UPDATE users 
SET role = 'master_admin', is_active = true
WHERE email = '85baris@gmail.com';

-- Verify the update
SELECT id, email, full_name, role, is_active 
FROM users 
WHERE email = '85baris@gmail.com'; 