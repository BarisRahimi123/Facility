-- Create master admin user if not exists
-- Replace the email and ID with your actual Supabase auth user details

-- First, check if user exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = '85baris@gmail.com') THEN
    -- Insert master admin user
    INSERT INTO users (
      id,
      email,
      full_name,
      role,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      (SELECT id FROM auth.users WHERE email = '85baris@gmail.com' LIMIT 1),
      '85baris@gmail.com',
      'Master Admin',
      'master_admin',
      true,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Master admin user created successfully';
  ELSE
    -- Update existing user to master_admin role
    UPDATE users 
    SET role = 'master_admin'
    WHERE email = '85baris@gmail.com';
    
    RAISE NOTICE 'Updated existing user to master_admin role';
  END IF;
END $$;

-- Verify the user was created/updated
SELECT id, email, full_name, role, is_active 
FROM users 
WHERE email = '85baris@gmail.com'; 