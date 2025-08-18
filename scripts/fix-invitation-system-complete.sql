-- Complete fix for the invitation system

-- First, create the user_role enum if it doesn't exist
DO $$ 
BEGIN
    -- Check if user_role enum exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('master_admin', 'sub_admin', 'staff', 'renter');
    END IF;
END $$;

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS can_invite_user CASCADE;
DROP FUNCTION IF EXISTS send_user_invitation CASCADE;

-- Create the can_invite_user function with proper signatures
CREATE OR REPLACE FUNCTION can_invite_user(inviter_role text, invitee_role text)
RETURNS boolean AS $$
BEGIN
    -- Master admin can invite sub_admin and staff
    IF inviter_role = 'master_admin' THEN
        RETURN invitee_role IN ('sub_admin', 'staff', 'renter');
    END IF;
    
    -- Sub admin can invite staff
    IF inviter_role = 'sub_admin' THEN
        RETURN invitee_role = 'staff';
    END IF;
    
    -- Legacy role support
    IF inviter_role = 'district_approver' THEN
        RETURN invitee_role IN ('sub_admin', 'staff');
    END IF;
    
    IF inviter_role IN ('site_approver', 'manager', 'coordinator', 'sub_master') THEN
        RETURN invitee_role = 'staff';
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create overloaded version for enum types
CREATE OR REPLACE FUNCTION can_invite_user(inviter_role user_role, invitee_role user_role)
RETURNS boolean AS $$
BEGIN
    RETURN can_invite_user(inviter_role::text, invitee_role::text);
END;
$$ LANGUAGE plpgsql;

-- Create the send_user_invitation function
CREATE OR REPLACE FUNCTION send_user_invitation(
    p_email text,
    p_role text,
    p_invited_by uuid,
    p_facility_id uuid DEFAULT NULL,
    p_organization_id uuid DEFAULT NULL,
    p_permissions jsonb DEFAULT '{}',
    p_metadata jsonb DEFAULT '{}'
)
RETURNS jsonb AS $$
DECLARE
    inviter_role text;
    invitation_token text;
    invitation_id uuid;
    v_expires_at timestamptz;
BEGIN
    -- Get inviter's role
    SELECT role INTO inviter_role FROM users WHERE id = p_invited_by;
    
    IF inviter_role IS NULL THEN
        RAISE EXCEPTION 'Inviter not found';
    END IF;
    
    -- Check if inviter can invite this role
    IF NOT can_invite_user(inviter_role, p_role) THEN
        RAISE EXCEPTION 'You do not have permission to invite users with role %', p_role;
    END IF;
    
    -- Check if user already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RAISE EXCEPTION 'A user with email % already exists', p_email;
    END IF;
    
    -- Check if invitation already exists and not expired
    IF EXISTS (
        SELECT 1 FROM user_invitations 
        WHERE email = p_email 
        AND accepted_at IS NULL 
        AND expires_at > NOW()
    ) THEN
        RAISE EXCEPTION 'An invitation has already been sent to %', p_email;
    END IF;
    
    -- Generate secure token
    BEGIN
        invitation_token := encode(gen_random_bytes(32), 'hex');
    EXCEPTION WHEN OTHERS THEN
        -- Fallback if gen_random_bytes is not available
        invitation_token := md5(random()::text || clock_timestamp()::text || p_email);
    END;
    
    v_expires_at := NOW() + INTERVAL '7 days';
    
    -- Create invitation record (cast role to user_role enum)
    INSERT INTO user_invitations (
        email,
        role,
        invited_by,
        token,
        expires_at,
        facility_id,
        organization_id,
        permissions,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        p_email,
        p_role::user_role,
        p_invited_by,
        invitation_token,
        v_expires_at,
        p_facility_id,
        p_organization_id,
        p_permissions,
        p_metadata,
        NOW(),
        NOW()
    ) RETURNING id INTO invitation_id;
    
    -- Return invitation details
    RETURN jsonb_build_object(
        'id', invitation_id,
        'email', p_email,
        'role', p_role,
        'token', invitation_token,
        'expires_at', v_expires_at,
        'invitation_url', '/auth/accept-invitation?token=' || invitation_token,
        'success', true
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create invitation: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_invite_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION can_invite_user(user_role, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION send_user_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION send_user_invitation TO anon;

-- Test functions
SELECT 'Invitation system functions created successfully' as status;
