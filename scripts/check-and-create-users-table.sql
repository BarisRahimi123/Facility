-- Check and create users table if it doesn't exist
-- This script creates the users table that the People page requires

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('master_admin', 'sub_admin', 'staff', 'manager', 'coordinator', 'vendor', 'renter', 'district_approver', 'site_approver')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  department TEXT,
  position TEXT,
  company TEXT,
  services TEXT[],
  organization_id UUID,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organizations table if it doesn't exist
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

-- Add foreign key constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_organization_id_fkey'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT users_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);

-- First, let's check the existing table structure
-- If the table already exists with different columns, we need to handle that

-- Insert master admin user if it doesn't exist
-- Check if 'name' column exists (old schema) or 'full_name' (new schema)
DO $$
BEGIN
  -- Check if the users table has a 'name' column
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'name'
  ) THEN
    -- Old schema with 'name' column
    INSERT INTO users (email, name, role, is_active)
    VALUES ('85baris@gmail.com', 'Baris Rahimi', 'master_admin', true)
    ON CONFLICT (email) 
    DO UPDATE SET 
      name = 'Baris Rahimi',
      role = 'master_admin',
      is_active = true;
  ELSE
    -- New schema with 'full_name' column
    INSERT INTO users (email, full_name, role, is_active)
    VALUES ('85baris@gmail.com', 'Baris Rahimi', 'master_admin', true)
    ON CONFLICT (email) 
    DO UPDATE SET 
      full_name = 'Baris Rahimi',
      role = 'master_admin',
      is_active = true;
  END IF;
END $$;

-- Grant permissions (for RLS if needed later)
GRANT ALL ON users TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON users TO anon;
GRANT ALL ON organizations TO anon;

-- Return success message
SELECT 'Users and Organizations tables created/verified successfully' as message;
