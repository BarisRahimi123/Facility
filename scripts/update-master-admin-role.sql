-- Update 85baris@gmail.com to have master_admin role
-- This script updates the user role to the highest level in the authentication hierarchy

-- First, check the current role
SELECT id, email, name, role, created_at
FROM users
WHERE email = '85baris@gmail.com';

-- Update the role to master_admin
UPDATE users
SET role = 'master_admin',
    updated_at = NOW()
WHERE email = '85baris@gmail.com';

-- Verify the update
SELECT id, email, name, role, created_at, updated_at
FROM users
WHERE email = '85baris@gmail.com';

-- Show all available roles in the system
SELECT unnest(enum_range(NULL::user_role)) AS available_roles;

-- Show role distribution
SELECT role, COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY user_count DESC; 