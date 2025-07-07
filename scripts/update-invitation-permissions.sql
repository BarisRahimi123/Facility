-- Update the can_invite_user function to allow master_admin to invite renters
CREATE OR REPLACE FUNCTION can_invite_user(inviter_role user_role, invitee_role user_role)
RETURNS boolean AS $$
BEGIN
    -- Master admin can invite anyone including renters
    IF inviter_role = 'master_admin' THEN
        RETURN true;
    END IF;
    
    -- Sub-master can invite staff, managers, coordinators, maintenance, and vendors (not renters)
    IF inviter_role = 'sub_master' THEN
        RETURN invitee_role IN ('staff', 'manager', 'coordinator', 'maintenance', 'vendor');
    END IF;
    
    -- Others cannot invite
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Update the send_user_invitation function to handle organization_id parameter
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