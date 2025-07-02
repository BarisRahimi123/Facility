-- Quick fix to make user work with existing system
-- This doesn't change the role structure, just makes sure you can access everything

-- First, let's see what roles exist
SELECT DISTINCT role FROM users;

-- Update your user to have the highest existing role
-- If district_approver exists, use it. Otherwise use staff.
UPDATE users 
SET role = 'district_approver'
WHERE email = '85baris@gmail.com' 
  AND EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'district_approver' AND enumtypid = 'user_role'::regtype);

-- If district_approver doesn't exist, use staff which should work
UPDATE users 
SET role = 'staff'
WHERE email = '85baris@gmail.com' 
  AND NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'district_approver' AND enumtypid = 'user_role'::regtype); 