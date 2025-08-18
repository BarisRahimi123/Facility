-- Migration: Create users and organizations tables for People management
-- Date: 2025-01-18
-- Description: Production-ready migration for user and organization management

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_role enum type
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'master_admin',
        'sub_admin', 
        'staff',
        'manager',
        'coordinator',
        'vendor',
        'renter',
        'district_approver',
        'site_approver'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create organizations table first (referenced by users)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('district', 'school', 'company', 'individual', 'vendor')),
    subtype TEXT CHECK (subtype IN ('individual', 'commercial', 'nonprofit')),
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    website TEXT,
    tax_id TEXT,
    is_active BOOLEAN DEFAULT true,
    services TEXT[],
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    department TEXT,
    position TEXT,
    company TEXT,
    services TEXT[],
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    organization_name TEXT,
    metadata JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_invitations table for invitation system
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role NOT NULL,
    token TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    facility_id UUID,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);

CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON user_invitations(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_invitations_updated_at ON user_invitations;
CREATE TRIGGER update_user_invitations_updated_at
    BEFORE UPDATE ON user_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert master admin user
INSERT INTO users (email, full_name, role, is_active)
VALUES ('85baris@gmail.com', 'Baris Rahimi', 'master_admin', true)
ON CONFLICT (email) 
DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Create RLS policies (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Master admins can do everything with users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('master_admin', 'district_approver')
        )
    );

CREATE POLICY "Sub admins can manage their organization users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users current_user
            WHERE current_user.id = auth.uid() 
            AND current_user.role IN ('sub_admin', 'site_approver', 'manager')
            AND (
                current_user.role IN ('master_admin', 'district_approver') OR
                current_user.organization_id = users.organization_id
            )
        )
    );

-- RLS Policies for organizations table
CREATE POLICY "Organizations are viewable by all authenticated users" ON organizations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Master admins can manage all organizations" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('master_admin', 'district_approver')
        )
    );

-- RLS Policies for user_invitations table
CREATE POLICY "Invitations viewable by admins" ON user_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('master_admin', 'sub_admin', 'district_approver', 'site_approver')
        )
    );

CREATE POLICY "Admins can manage invitations" ON user_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('master_admin', 'sub_admin', 'district_approver', 'site_approver')
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON user_invitations TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON organizations TO anon;

-- Create functions for invitation system
CREATE OR REPLACE FUNCTION can_invite_user(inviter_role user_role, invitee_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN CASE
        WHEN inviter_role IN ('master_admin', 'district_approver') THEN true
        WHEN inviter_role IN ('sub_admin', 'site_approver') AND invitee_role IN ('staff', 'manager', 'coordinator') THEN true
        ELSE false
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_user_invitation(
    p_email TEXT,
    p_role user_role,
    p_invited_by UUID,
    p_facility_id UUID DEFAULT NULL,
    p_organization_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    v_inviter_role user_role;
    v_invitation_id UUID;
    v_token TEXT;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get inviter role
    SELECT role INTO v_inviter_role FROM users WHERE id = p_invited_by;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Inviter not found');
    END IF;
    
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'A user with email ' || p_email || ' already exists');
    END IF;
    
    -- Check if invitation already sent
    IF EXISTS (
        SELECT 1 FROM user_invitations 
        WHERE email = p_email 
        AND status = 'pending' 
        AND expires_at > NOW()
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'An invitation has already been sent to ' || p_email);
    END IF;
    
    -- Check permissions
    IF NOT can_invite_user(v_inviter_role, p_role) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not have permission to invite this type of user');
    END IF;
    
    -- Generate token and expiry
    v_token := encode(digest(random()::text || clock_timestamp()::text, 'sha256'), 'hex');
    v_expires_at := NOW() + INTERVAL '7 days';
    
    -- Create invitation
    INSERT INTO user_invitations (
        email, role, token, invited_by, facility_id, organization_id, metadata, expires_at
    ) VALUES (
        p_email, p_role, v_token, p_invited_by, p_facility_id, p_organization_id, p_metadata, v_expires_at
    ) RETURNING id INTO v_invitation_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'id', v_invitation_id,
        'email', p_email,
        'role', p_role,
        'token', v_token,
        'expires_at', v_expires_at,
        'invitation_url', '/auth/accept-invitation?token=' || v_token
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to create invitation: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the migration worked
SELECT 
    'Migration completed successfully! Tables created:' as message,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('users', 'organizations', 'user_invitations')) as tables_created,
    (SELECT COUNT(*) FROM users WHERE email = '85baris@gmail.com') as master_admin_created;
