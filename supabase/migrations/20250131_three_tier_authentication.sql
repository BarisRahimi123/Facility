-- =====================================================
-- THREE-TIER AUTHENTICATION SYSTEM MIGRATION
-- Master Admin → Sub Admin → Staff Users
-- =====================================================

-- Step 1: Update user_role enum to three-tier system
-- First, rename the old enum to preserve it
ALTER TYPE user_role RENAME TO user_role_old;

-- Create new simplified enum with just three roles
CREATE TYPE user_role AS ENUM ('master_admin', 'sub_admin', 'staff');

-- Update the users table to use the new enum
ALTER TABLE users 
ALTER COLUMN role TYPE user_role 
USING CASE 
  WHEN role::text IN ('master_admin', 'district_approver') THEN 'master_admin'::user_role
  WHEN role::text IN ('sub_master', 'site_approver', 'manager', 'coordinator') THEN 'sub_admin'::user_role
  ELSE 'staff'::user_role
END;

-- Drop the old enum
DROP TYPE user_role_old CASCADE;

-- Step 2: Update organizations table for multi-tenancy
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS org_type TEXT DEFAULT 'tenant' 
CHECK (org_type IN ('master', 'tenant'));

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS parent_org_id UUID REFERENCES organizations(id);

-- Create master organization for platform owner
INSERT INTO organizations (id, name, org_type, type, is_active, created_at)
VALUES (
  'b47ac120-58cc-4372-a567-0e02b2c3d590',
  'Platform Master Organization', 
  'master',
  'district',
  true,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Update master admin user to belong to master organization
UPDATE users 
SET organization_id = 'b47ac120-58cc-4372-a567-0e02b2c3d590'
WHERE email = '85baris@gmail.com' AND role = 'master_admin';

-- Step 3: Add organization_id to all resource tables for data isolation
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_facilities_org ON facilities(organization_id);
CREATE INDEX IF NOT EXISTS idx_fields_org ON fields(organization_id);
CREATE INDEX IF NOT EXISTS idx_buildings_org ON buildings(organization_id);

-- Step 4: Migrate existing data to organizations
-- First, create a default tenant organization for existing data
INSERT INTO organizations (id, name, org_type, type, is_active, created_at)
VALUES (
  'a47ac120-58cc-4372-a567-0e02b2c3d591',
  'Default Tenant Organization', 
  'tenant',
  'district',
  true,
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Assign existing facilities to default organization
UPDATE facilities 
SET organization_id = 'a47ac120-58cc-4372-a567-0e02b2c3d591'
WHERE organization_id IS NULL;

-- Fields inherit organization from their facility
UPDATE fields f
SET organization_id = fac.organization_id
FROM facilities fac
WHERE f.facility_id = fac.id AND f.organization_id IS NULL;

-- Buildings inherit organization from their facility
UPDATE buildings b
SET organization_id = fac.organization_id
FROM facilities fac
WHERE b.facility_id = fac.id AND b.organization_id IS NULL;

-- Step 5: Create RLS policies for data isolation
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow public to view facilities" ON facilities;
DROP POLICY IF EXISTS "Allow public to view buildings" ON buildings;
DROP POLICY IF EXISTS "Allow public to view rooms" ON rooms;

-- Organizations policy
CREATE POLICY "org_isolation_organizations" ON organizations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (
      users.role = 'master_admin' 
      OR users.organization_id = organizations.id
    )
  )
);

-- Facilities policy
CREATE POLICY "org_isolation_facilities" ON facilities
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (
      users.role = 'master_admin' 
      OR users.organization_id = facilities.organization_id
    )
  )
);

-- Buildings policy
CREATE POLICY "org_isolation_buildings" ON buildings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (
      users.role = 'master_admin' 
      OR users.organization_id = buildings.organization_id
    )
  )
);

-- Fields policy
CREATE POLICY "org_isolation_fields" ON fields
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (
      users.role = 'master_admin' 
      OR users.organization_id = fields.organization_id
    )
  )
);

-- Rooms policy (inherit from building)
CREATE POLICY "org_isolation_rooms" ON rooms
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u
    INNER JOIN buildings b ON b.id = rooms.building_id
    WHERE u.id = auth.uid() 
    AND (
      u.role = 'master_admin' 
      OR u.organization_id = b.organization_id
    )
  )
);

-- Step 6: Update invitation system
-- Update can_invite_user function for three-tier system
CREATE OR REPLACE FUNCTION can_invite_user(inviter_role user_role, invitee_role user_role)
RETURNS boolean AS $$
BEGIN
    -- Master admin can only invite sub_admins
    IF inviter_role = 'master_admin' THEN
        RETURN invitee_role = 'sub_admin';
    END IF;
    
    -- Sub admin can only invite staff
    IF inviter_role = 'sub_admin' THEN
        RETURN invitee_role = 'staff';
    END IF;
    
    -- Staff cannot invite anyone
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Update invitation policies
DROP POLICY IF EXISTS "Users can create invitations based on role" ON user_invitations;

CREATE POLICY "Users can create invitations based on role" ON user_invitations
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.id = invited_by
        AND can_invite_user(users.role, role)
    )
);

-- Step 7: Create helper functions for organization access
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM users
    WHERE id = auth.uid();
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can access organization
CREATE OR REPLACE FUNCTION can_access_organization(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val user_role;
    user_org_id UUID;
BEGIN
    SELECT role, organization_id INTO user_role_val, user_org_id
    FROM users
    WHERE id = auth.uid();
    
    -- Master admins can access all organizations
    IF user_role_val = 'master_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Others can only access their own organization
    RETURN user_org_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Add audit columns
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE fields ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Add comments for documentation
COMMENT ON TYPE user_role IS 'Three-tier authentication roles: master_admin (platform owner), sub_admin (organization owner), staff (team members)';
COMMENT ON COLUMN organizations.org_type IS 'Organization type: master (platform organization) or tenant (customer organization)';
COMMENT ON COLUMN organizations.parent_org_id IS 'For future hierarchical organization support';
COMMENT ON FUNCTION can_access_organization IS 'Check if current user can access a specific organization based on role and membership';
COMMENT ON FUNCTION get_user_organization_id IS 'Get the organization ID of the current authenticated user'; 