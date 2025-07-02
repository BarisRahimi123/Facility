-- Authentication Hierarchy Migration - Part 2: Complete Setup
-- Run this AFTER Part 1 has been executed and committed

-- Now update users table to map old roles to new ones
UPDATE users 
SET role = CASE role 
    WHEN 'district_approver' THEN 'master_admin'
    WHEN 'site_approver' THEN 'sub_master'
    WHEN 'staff' THEN 'staff'
    WHEN 'maintenance' THEN 'maintenance'
    WHEN 'support' THEN 'staff'  -- Map support to staff
    ELSE 'renter'
END::user_role
WHERE role IS NOT NULL;

-- Add additional user fields if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}';

-- Create invitations table for managing user invitations
CREATE TABLE IF NOT EXISTS user_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    role user_role NOT NULL,
    invited_by uuid REFERENCES users(id) NOT NULL,
    token text UNIQUE NOT NULL,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at timestamptz,
    facility_id uuid REFERENCES facilities(id),
    organization_id uuid REFERENCES organizations(id),
    permissions jsonb DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_invited_by ON user_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create function to check if user can invite another user
CREATE OR REPLACE FUNCTION can_invite_user(inviter_role user_role, invitee_role user_role)
RETURNS boolean AS $$
BEGIN
    -- Master admin can invite anyone
    IF inviter_role = 'master_admin' THEN
        RETURN true;
    END IF;
    
    -- Sub-master can invite staff, managers, coordinators, maintenance, and vendors
    IF inviter_role = 'sub_master' THEN
        RETURN invitee_role IN ('staff', 'manager', 'coordinator', 'maintenance', 'vendor');
    END IF;
    
    -- Others cannot invite
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate unique invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS text AS $$
DECLARE
    token text;
    token_exists boolean;
BEGIN
    LOOP
        -- Generate a random token
        token := encode(gen_random_bytes(32), 'hex');
        
        -- Check if token already exists
        SELECT EXISTS(SELECT 1 FROM user_invitations WHERE user_invitations.token = token) INTO token_exists;
        
        -- If token doesn't exist, we can use it
        IF NOT token_exists THEN
            RETURN token;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to send user invitation
CREATE OR REPLACE FUNCTION send_user_invitation(
    p_email text,
    p_role user_role,
    p_invited_by uuid,
    p_facility_id uuid DEFAULT NULL,
    p_organization_id uuid DEFAULT NULL,
    p_permissions jsonb DEFAULT '{}',
    p_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb AS $$
DECLARE
    inviter_role user_role;
    invitation_token text;
    invitation_id uuid;
BEGIN
    -- Get inviter's role
    SELECT role INTO inviter_role FROM users WHERE id = p_invited_by;
    
    -- Check if inviter can invite this role
    IF NOT can_invite_user(inviter_role, p_role) THEN
        RAISE EXCEPTION 'You do not have permission to invite users with role %', p_role;
    END IF;
    
    -- Generate invitation token
    invitation_token := generate_invitation_token();
    
    -- Create invitation
    INSERT INTO user_invitations (
        email, role, invited_by, token, facility_id, 
        organization_id, permissions, metadata
    ) VALUES (
        p_email, p_role, p_invited_by, invitation_token, 
        p_facility_id, p_organization_id, p_permissions, p_metadata
    ) RETURNING id INTO invitation_id;
    
    -- Return invitation details
    RETURN jsonb_build_object(
        'id', invitation_id,
        'token', invitation_token,
        'email', p_email,
        'role', p_role,
        'expires_at', (now() + interval '7 days')
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_invitations_updated_at 
    BEFORE UPDATE ON user_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing users to have proper role hierarchy
-- Set 85baris@gmail.com as master_admin
UPDATE users 
SET role = 'master_admin'::user_role
WHERE email = '85baris@gmail.com';

-- Create RLS policies for invitations
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see invitations they sent
CREATE POLICY "Users can view their sent invitations" ON user_invitations
    FOR SELECT
    USING (auth.uid() = invited_by);

-- Policy: Master admins can see all invitations
CREATE POLICY "Master admins can view all invitations" ON user_invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'master_admin'
        )
    );

-- Policy: Users can create invitations based on their role
CREATE POLICY "Users can create invitations based on role" ON user_invitations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.id = invited_by
            AND (
                users.role = 'master_admin' OR 
                (users.role = 'sub_master' AND role IN ('staff', 'manager', 'coordinator', 'maintenance', 'vendor'))
            )
        )
    );

-- Add comments for documentation
COMMENT ON TABLE user_invitations IS 'Stores user invitations for hierarchical user management';
COMMENT ON COLUMN user_invitations.role IS 'The role being assigned to the invited user';
COMMENT ON COLUMN user_invitations.invited_by IS 'The user who sent the invitation';
COMMENT ON COLUMN user_invitations.token IS 'Unique token for accepting the invitation';
COMMENT ON COLUMN user_invitations.expires_at IS 'When the invitation expires';
COMMENT ON COLUMN user_invitations.facility_id IS 'Optional facility assignment for the invited user';
COMMENT ON COLUMN user_invitations.permissions IS 'Custom permissions for the invited user'; 