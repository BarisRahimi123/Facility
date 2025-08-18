-- Fix the send_user_invitation function for production database
-- The function currently has a column name mismatch issue

-- Drop existing function to avoid conflicts
DROP FUNCTION IF EXISTS send_user_invitation(text, text, uuid, uuid, uuid, jsonb, jsonb);
DROP FUNCTION IF EXISTS send_user_invitation(text, user_role, uuid, uuid, uuid, jsonb, jsonb);
DROP FUNCTION IF EXISTS send_user_invitation CASCADE;

-- Create the corrected send_user_invitation function
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
    
    -- Check if inviter can invite this role using text parameters
    IF NOT can_invite_user(inviter_role::user_role, p_role::user_role) THEN
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
    
    -- Generate secure token (use md5 for compatibility if gen_random_bytes not available)
    BEGIN
        invitation_token := encode(gen_random_bytes(32), 'hex');
    EXCEPTION WHEN OTHERS THEN
        -- Fallback if gen_random_bytes is not available
        invitation_token := md5(random()::text || clock_timestamp()::text || p_email);
    END;
    
    v_expires_at := NOW() + INTERVAL '7 days';
    
    -- Create invitation record
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION send_user_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION send_user_invitation TO anon;

-- Test the function
SELECT 'Function created successfully' as status;
