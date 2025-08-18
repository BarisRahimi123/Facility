-- Fix the existing users table and insert master admin
-- This script handles the case where users table already exists with 'name' column

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Since the table exists with 'name' column, let's just insert/update the master admin
INSERT INTO users (email, name, role, is_active)
VALUES ('85baris@gmail.com', 'Baris Rahimi', 'master_admin', true)
ON CONFLICT (email) 
DO UPDATE SET 
  name = 'Baris Rahimi',
  role = 'master_admin',
  is_active = true;

-- Check if organizations table exists, create if not
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  is_active BOOLEAN DEFAULT true,
  services TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON organizations TO anon;

-- Verify the master admin was created
SELECT id, email, name, role, is_active 
FROM users 
WHERE email = '85baris@gmail.com';

-- Count total users
SELECT COUNT(*) as total_users FROM users;

-- Show success message
SELECT 'Master admin user created/updated successfully!' as message;
