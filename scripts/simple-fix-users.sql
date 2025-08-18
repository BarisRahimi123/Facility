-- Simple step-by-step fix for users table
-- Run each section separately if needed

-- Step 1: Check what we have
SELECT table_name FROM information_schema.tables WHERE table_name = 'users';

-- Step 2: See the structure
\d users;

-- Step 3: Try simple insert (run this after seeing the structure)
-- UPDATE THIS BASED ON WHAT COLUMNS YOU SEE:

-- If you see 'name' column:
-- INSERT INTO users (email, name, role) VALUES ('85baris@gmail.com', 'Baris Rahimi', 'master_admin');

-- If you see 'full_name' column:
-- INSERT INTO users (email, full_name, role) VALUES ('85baris@gmail.com', 'Baris Rahimi', 'master_admin');

-- Step 4: Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
