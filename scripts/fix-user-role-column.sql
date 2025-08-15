-- First, check what role-related columns exist
SELECT 
  column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name LIKE '%role%';

-- Check if it's 'role' instead of 'user_role'
DO $$
BEGIN
  -- Try to update using 'role' column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'role'
  ) THEN
    UPDATE users 
    SET role = 'master_admin'
    WHERE email = '85baris@gmail.com';
    RAISE NOTICE 'Updated role column';
  
  -- Try to update using 'user_role' column
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'user_role'
  ) THEN
    UPDATE users 
    SET user_role = 'master_admin'
    WHERE email = '85baris@gmail.com';
    RAISE NOTICE 'Updated user_role column';
  
  -- If neither exists, add the column
  ELSE
    ALTER TABLE users ADD COLUMN user_role text DEFAULT 'staff';
    UPDATE users 
    SET user_role = 'master_admin'
    WHERE email = '85baris@gmail.com';
    RAISE NOTICE 'Added user_role column and updated';
  END IF;
END $$;

-- Verify the update
SELECT 
  id,
  email,
  COALESCE(
    (SELECT role FROM users WHERE email = '85baris@gmail.com' AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role')),
    (SELECT user_role FROM users WHERE email = '85baris@gmail.com' AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'user_role'))
  ) as current_role,
  organization_id
FROM users
WHERE email = '85baris@gmail.com'; 