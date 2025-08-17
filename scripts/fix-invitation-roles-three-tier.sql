-- Fix the invitation functions to use the correct three-tier role names
-- The three-tier system uses: master_admin, sub_admin, staff
-- Not: master_admin, sub_master, staff

-- First, drop the existing can_invite_user function
DROP FUNCTION IF EXISTS can_invite_user CASCADE;

-- Recreate can_invite_user with correct role names
CREATE OR REPLACE FUNCTION can_invite_user(inviter_role text, invitee_role text)
RETURNS BOOLEAN AS $$
BEGIN
    -- Master admin can invite sub admins
    IF inviter_role = 'master_admin' AND invitee_role = 'sub_admin' THEN
        RETURN TRUE;
    END IF;
    
    -- Sub admin can invite staff
    IF inviter_role = 'sub_admin' AND invitee_role = 'staff' THEN
        RETURN TRUE;
    END IF;
    
    -- Legacy role mappings for backward compatibility
    IF inviter_role = 'district_approver' AND invitee_role IN ('sub_admin', 'staff') THEN
        RETURN TRUE;
    END IF;
    
    IF inviter_role IN ('site_approver', 'manager', 'coordinator') AND invitee_role = 'staff' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Drop ALL existing versions of send_user_invitation
DROP FUNCTION IF EXISTS send_user_invitation(text, text, uuid);
DROP FUNCTION IF EXISTS send_user_invitation(text, text, uuid, uuid);
DROP FUNCTION IF EXISTS send_user_invitation(text, text, uuid, uuid, uuid);
DROP FUNCTION IF EXISTS send_user_invitation(text, text, uuid, uuid, uuid, jsonb);
DROP FUNCTION IF EXISTS send_user_invitation(text, text, uuid, uuid, jsonb);
DROP FUNCTION IF EXISTS send_user_invitation(text, user_role, uuid, uuid, uuid, jsonb);

-- Create the correct version of send_user_invitation with text role parameter
CREATE OR REPLACE FUNCTION send_user_invitation(
    p_email text,
    p_role text, -- Using text instead of enum for flexibility
    p_invited_by uuid,
    p_facility_id uuid DEFAULT NULL,
    p_organization_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb AS $$
DECLARE
    v_inviter_role text;
    v_token text;
    v_invitation_id uuid;
    v_expires_at timestamp;
    v_org_id uuid;
BEGIN
    -- Get inviter's role
    SELECT role INTO v_inviter_role 
    FROM users 
    WHERE id = p_invited_by;
    
    IF v_inviter_role IS NULL THEN
        RAISE EXCEPTION 'Inviter not found';
    END IF;
    
    -- Check if inviter can invite this role
    IF NOT can_invite_user(v_inviter_role, p_role) THEN
        RAISE EXCEPTION 'You do not have permission to invite users with role %', p_role;
    END IF;
    
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RAISE EXCEPTION 'A user with email % already exists', p_email;
    END IF;
    
    -- Check if invitation already sent and not expired
    IF EXISTS (
        SELECT 1 FROM user_invitations 
        WHERE email = p_email 
        AND status = 'pending' 
        AND expires_at > NOW()
    ) THEN
        RAISE EXCEPTION 'An invitation has already been sent to %', p_email;
    END IF;
    
    -- Generate secure token using md5 and random for compatibility
    v_token := md5(random()::text || clock_timestamp()::text || p_email);
    v_expires_at := NOW() + INTERVAL '7 days';
    
    -- Determine organization_id based on inviter's role
    IF v_inviter_role = 'master_admin' THEN
        -- Master admin creating sub admin - new organization will be created on acceptance
        v_org_id := p_organization_id; -- May be NULL for new organizations
    ELSIF v_inviter_role = 'sub_admin' THEN
        -- Sub admin inviting staff - use inviter's organization
        SELECT organization_id INTO v_org_id 
        FROM users 
        WHERE id = p_invited_by;
    ELSE
        -- Legacy roles - use inviter's organization
        SELECT organization_id INTO v_org_id 
        FROM users 
        WHERE id = p_invited_by;
    END IF;
    
    -- Create invitation
    INSERT INTO user_invitations (
        email, 
        role, 
        invited_by, 
        token, 
        expires_at, 
        status,
        facility_id,
        organization_id,
        metadata
    ) VALUES (
        p_email, 
        p_role::user_role, 
        p_invited_by, 
        v_token, 
        v_expires_at, 
        'pending',
        p_facility_id,
        v_org_id,
        p_metadata
    ) RETURNING id INTO v_invitation_id;
    
    -- Return invitation details
    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', v_invitation_id,
        'email', p_email,
        'role', p_role,
        'token', v_token,
        'expires_at', v_expires_at,
        'invitation_url', format('%s/auth/accept-invitation?token=%s', 
            current_setting('app.base_url', true), v_token)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_invite_user TO authenticated;
GRANT EXECUTE ON FUNCTION send_user_invitation TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION can_invite_user IS 'Checks if a user with given role can invite another user with target role';
COMMENT ON FUNCTION send_user_invitation IS 'Sends an invitation to a new user with proper role-based permissions';

-- Test the functions to ensure they work
DO $$
BEGIN
    -- Test can_invite_user
    IF NOT can_invite_user('master_admin', 'sub_admin') THEN
        RAISE WARNING 'Test failed: master_admin should be able to invite sub_admin';
    END IF;
    
    IF NOT can_invite_user('sub_admin', 'staff') THEN
        RAISE WARNING 'Test failed: sub_admin should be able to invite staff';
    END IF;
    
    IF can_invite_user('staff', 'sub_admin') THEN
        RAISE WARNING 'Test failed: staff should NOT be able to invite sub_admin';
    END IF;
    
    RAISE NOTICE 'Invitation functions fixed for three-tier authentication system';
    RAISE NOTICE 'Role hierarchy: master_admin -> sub_admin -> staff';
END
$$;

