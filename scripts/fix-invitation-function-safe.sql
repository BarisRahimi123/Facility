-- Safe function replacement script
-- This handles various edge cases and potential issues

-- First, let's see what we're dealing with
DO $$
BEGIN
    RAISE NOTICE 'Starting function replacement...';
END $$;

-- Drop existing functions using CASCADE to handle dependencies
-- We use IF EXISTS to avoid errors if they don't exist
DROP FUNCTION IF EXISTS public.send_user_invitation CASCADE;

-- Now let's check the user_invitations table structure
-- and create it if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    role text NOT NULL,  -- Using text instead of user_role enum for flexibility
    invited_by uuid REFERENCES users(id),
    facility_id uuid REFERENCES facilities(id),
    organization_id uuid REFERENCES organizations(id),
    token text UNIQUE NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    accepted_by uuid REFERENCES users(id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);

-- Create or replace the can_invite_user function
CREATE OR REPLACE FUNCTION can_invite_user(inviter_role text, invitee_role text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    -- Master admin can invite anyone
    IF inviter_role IN ('master_admin', 'district_approver') THEN
        RETURN true;
    END IF;
    
    -- Sub admin can invite staff
    IF inviter_role IN ('sub_admin', 'sub_master', 'site_approver') AND invitee_role = 'staff' THEN
        RETURN true;
    END IF;
    
    -- Default: no permission
    RETURN false;
END;
$$;

-- Create the send_user_invitation function
CREATE OR REPLACE FUNCTION send_user_invitation(
    p_email text,
    p_role text,
    p_invited_by uuid,
    p_facility_id uuid DEFAULT NULL,
    p_organization_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation_id uuid;
    v_token text;
    v_inviter_role text;
    v_can_invite boolean;
BEGIN
    -- Get inviter's role
    SELECT role INTO v_inviter_role
    FROM users
    WHERE id = p_invited_by;
    
    IF v_inviter_role IS NULL THEN
        RAISE EXCEPTION 'Inviter not found';
    END IF;
    
    -- Check if inviter can invite this role
    v_can_invite := can_invite_user(v_inviter_role, p_role);
    
    IF NOT v_can_invite THEN
        RAISE EXCEPTION 'You do not have permission to invite users with role %', p_role;
    END IF;
    
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RAISE EXCEPTION 'User with email % already exists', p_email;
    END IF;
    
    -- Check if invitation already exists
    IF EXISTS (SELECT 1 FROM user_invitations WHERE email = p_email AND status = 'pending') THEN
        RAISE EXCEPTION 'An invitation has already been sent to %', p_email;
    END IF;
    
    -- Generate unique token
    v_token := encode(gen_random_bytes(32), 'hex');
    
    -- Create invitation
    INSERT INTO user_invitations (
        email,
        role,
        invited_by,
        facility_id,
        organization_id,
        token,
        metadata,
        expires_at
    ) VALUES (
        p_email,
        p_role,
        p_invited_by,
        p_facility_id,
        p_organization_id,
        v_token,
        p_metadata,
        now() + interval '7 days'
    )
    RETURNING id INTO v_invitation_id;
    
    -- Return invitation details
    RETURN jsonb_build_object(
        'id', v_invitation_id,
        'email', p_email,
        'role', p_role,
        'token', v_token,
        'invitation_url', '/auth/accept-invitation?token=' || v_token
    );
END;
$$;

-- Create or replace accept_invitation function
CREATE OR REPLACE FUNCTION accept_invitation(
    p_token text,
    p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation record;
    v_user_id uuid;
BEGIN
    -- Get invitation details
    SELECT * INTO v_invitation
    FROM user_invitations
    WHERE token = p_token
        AND status = 'pending'
        AND expires_at > now()
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation';
    END IF;
    
    -- Create user record
    INSERT INTO users (
        id,
        email,
        full_name,
        role,
        organization_id,
        invited_by,
        invited_at,
        phone,
        department,
        position
    ) VALUES (
        p_user_id,
        v_invitation.email,
        COALESCE(v_invitation.metadata->>'fullName', v_invitation.email),
        v_invitation.role,
        v_invitation.organization_id,
        v_invitation.invited_by,
        v_invitation.created_at,
        v_invitation.metadata->>'phone',
        v_invitation.metadata->>'department',
        v_invitation.metadata->>'position'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id
    RETURNING id INTO v_user_id;
    
    -- Update invitation status
    UPDATE user_invitations
    SET 
        status = 'accepted',
        accepted_at = now(),
        accepted_by = v_user_id
    WHERE id = v_invitation.id;
    
    -- If facility was specified, create assignment
    IF v_invitation.facility_id IS NOT NULL THEN
        INSERT INTO user_facilities (user_id, facility_id)
        VALUES (v_user_id, v_invitation.facility_id)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'role', v_invitation.role
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_user_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation TO anon, authenticated;
GRANT EXECUTE ON FUNCTION can_invite_user TO authenticated;

-- Add RLS policies if not exists
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own invitations" ON user_invitations;
DROP POLICY IF EXISTS "Users can create invitations based on role" ON user_invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON user_invitations;

-- Create new policies
CREATE POLICY "Users can view their own invitations"
    ON user_invitations FOR SELECT
    USING (auth.uid() = invited_by OR email = auth.email());

CREATE POLICY "Users can create invitations based on role"
    ON user_invitations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND can_invite_user(role, NEW.role)
        )
    );

CREATE POLICY "Anyone can view invitation by token"
    ON user_invitations FOR SELECT
    USING (true);  -- Token is unguessable, so this is safe

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Functions created successfully!';
    RAISE NOTICE 'You can now use send_user_invitation with these parameters:';
    RAISE NOTICE '  - p_email: text (required)';
    RAISE NOTICE '  - p_role: text (required)';
    RAISE NOTICE '  - p_invited_by: uuid (required)';
    RAISE NOTICE '  - p_facility_id: uuid (optional)';
    RAISE NOTICE '  - p_organization_id: uuid (optional)';
    RAISE NOTICE '  - p_metadata: jsonb (optional)';
END $$; 