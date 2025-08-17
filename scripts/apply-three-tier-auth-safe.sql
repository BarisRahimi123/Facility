-- =====================================================
-- SAFE THREE-TIER AUTHENTICATION SYSTEM FIX
-- This script checks current state and applies only what's needed
-- =====================================================

-- First, let's check what we have
DO $$
BEGIN
    RAISE NOTICE 'Starting three-tier authentication fix...';
END $$;

-- Step 1: Check and update user_role enum
-- First check if user_role enum exists
DO $$
BEGIN
    -- Check if user_role type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Create the enum if it doesn't exist
        CREATE TYPE user_role AS ENUM ('master_admin', 'sub_admin', 'staff');
        RAISE NOTICE 'Created user_role enum';
    ELSE
        -- Check if the enum has the right values
        -- For now, we'll just log that it exists
        RAISE NOTICE 'user_role enum already exists';
    END IF;
END $$;

-- Step 2: Check if organizations table has required columns
DO $$
BEGIN
    -- Add org_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'org_type'
    ) THEN
        ALTER TABLE organizations 
        ADD COLUMN org_type TEXT DEFAULT 'tenant' 
        CHECK (org_type IN ('master', 'tenant'));
        RAISE NOTICE 'Added org_type column to organizations';
    END IF;
    
    -- Add parent_org_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' 
        AND column_name = 'parent_org_id'
    ) THEN
        ALTER TABLE organizations
        ADD COLUMN parent_org_id UUID REFERENCES organizations(id);
        RAISE NOTICE 'Added parent_org_id column to organizations';
    END IF;
END $$;

-- Step 3: Create master organization if it doesn't exist
INSERT INTO organizations (id, name, org_type, type, is_active, created_at)
VALUES (
    'b47ac120-58cc-4372-a567-0e02b2c3d590',
    'Platform Master Organization', 
    'master',
    'district',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE 
SET org_type = 'master'
WHERE organizations.id = 'b47ac120-58cc-4372-a567-0e02b2c3d590';

-- Step 4: Update master admin user
-- First ensure the master admin has the correct role
UPDATE users 
SET 
    role = 'master_admin',
    organization_id = 'b47ac120-58cc-4372-a567-0e02b2c3d590'
WHERE email = '85baris@gmail.com';

-- Step 5: Add organization_id to resource tables if missing
DO $$
BEGIN
    -- Add to facilities
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'facilities' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE facilities ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_facilities_org ON facilities(organization_id);
        RAISE NOTICE 'Added organization_id to facilities';
    END IF;
    
    -- Add to fields
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fields' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE fields ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_fields_org ON fields(organization_id);
        RAISE NOTICE 'Added organization_id to fields';
    END IF;
    
    -- Add to buildings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'buildings' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE buildings ADD COLUMN organization_id UUID REFERENCES organizations(id);
        CREATE INDEX idx_buildings_org ON buildings(organization_id);
        RAISE NOTICE 'Added organization_id to buildings';
    END IF;
END $$;

-- Step 6: Create or update default tenant organization
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

-- Step 7: Assign existing data to organizations
-- Assign facilities without organization to default org
UPDATE facilities 
SET organization_id = 'a47ac120-58cc-4372-a567-0e02b2c3d591'
WHERE organization_id IS NULL;

-- Fields inherit from facility
UPDATE fields f
SET organization_id = fac.organization_id
FROM facilities fac
WHERE f.facility_id = fac.id 
AND f.organization_id IS NULL;

-- Buildings inherit from facility
UPDATE buildings b
SET organization_id = fac.organization_id
FROM facilities fac
WHERE b.facility_id = fac.id 
AND b.organization_id IS NULL;

-- Step 8: Create or replace helper functions
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

CREATE OR REPLACE FUNCTION can_access_organization(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_val TEXT;
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

-- Step 9: Create or update can_invite_user function
-- This function needs to handle TEXT role values since we're using role column
CREATE OR REPLACE FUNCTION can_invite_user(inviter_role TEXT, invitee_role TEXT)
RETURNS boolean AS $$
BEGIN
    -- Master admin can invite sub_admins and renters
    IF inviter_role = 'master_admin' THEN
        RETURN invitee_role IN ('sub_admin', 'renter');
    END IF;
    
    -- Sub admin can invite staff
    IF inviter_role = 'sub_admin' THEN
        RETURN invitee_role = 'staff';
    END IF;
    
    -- Staff cannot invite anyone
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Enable RLS if not already enabled
DO $$
BEGIN
    -- Check and enable RLS on tables
    ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
    ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
    ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on all tables';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'RLS already enabled or error: %', SQLERRM;
END $$;

-- Step 11: Create RLS policies if they don't exist
-- Drop and recreate to ensure they're correct
DROP POLICY IF EXISTS "org_isolation_organizations" ON organizations;
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

DROP POLICY IF EXISTS "org_isolation_facilities" ON facilities;
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

DROP POLICY IF EXISTS "org_isolation_buildings" ON buildings;
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

DROP POLICY IF EXISTS "org_isolation_fields" ON fields;
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

DROP POLICY IF EXISTS "org_isolation_rooms" ON rooms;
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

-- Final status
DO $$
BEGIN
    RAISE NOTICE 'Three-tier authentication setup complete!';
    RAISE NOTICE 'Master admin (85baris@gmail.com) should now have full access';
END $$;
