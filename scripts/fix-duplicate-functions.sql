-- Fix duplicate function issues by dropping all versions first

-- First, let's see what functions exist
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('can_invite_user', 'send_user_invitation')
ORDER BY p.proname;

-- Drop all versions of can_invite_user
DO $$
DECLARE
    _sql text;
BEGIN
    FOR _sql IN
        SELECT 'DROP FUNCTION IF EXISTS ' || oid::regprocedure || ' CASCADE;'
        FROM pg_proc
        WHERE proname = 'can_invite_user'
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE _sql;
    END LOOP;
END $$;

-- Drop all versions of send_user_invitation
DO $$
DECLARE
    _sql text;
BEGIN
    FOR _sql IN
        SELECT 'DROP FUNCTION IF EXISTS ' || oid::regprocedure || ' CASCADE;'
        FROM pg_proc
        WHERE proname = 'send_user_invitation'
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE _sql;
    END LOOP;
END $$;

-- Now let's fix the user_invitations table columns
ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));

ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS accepted_by uuid REFERENCES users(id);

ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Update expires_at for existing rows if needed
UPDATE user_invitations 
SET expires_at = COALESCE(expires_at, created_at + interval '7 days')
WHERE expires_at IS NULL;

-- Make expires_at NOT NULL if it isn't already
DO $$
BEGIN
    ALTER TABLE user_invitations ALTER COLUMN expires_at SET NOT NULL;
EXCEPTION
    WHEN others THEN
        NULL; -- Ignore if already NOT NULL
END $$;

-- Create the can_invite_user function (only one version)
CREATE OR REPLACE FUNCTION can_invite_user(inviter_role text, invitee_role text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
    -- Master admin can invite anyone
    IF inviter_role IN ('master_admin', 'district_approver') THEN
        RETURN true;
    END IF;
    
    -- Sub admin can invite staff and renters
    IF inviter_role IN ('sub_admin', 'sub_master', 'site_approver') THEN
        RETURN invitee_role IN ('staff', 'renter', 'sub_admin');
    END IF;
    
    -- Default: no permission
    RETURN false;
END;
$$;

-- Create the send_user_invitation function (only one version)
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
        status,
        expires_at
    ) VALUES (
        p_email,
        p_role,
        p_invited_by,
        p_facility_id,
        p_organization_id,
        v_token,
        p_metadata,
        'pending',
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_invite_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION send_user_invitation(text, text, uuid, uuid, uuid, jsonb) TO authenticated;

-- Verify functions were created
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('can_invite_user', 'send_user_invitation')
ORDER BY p.proname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Functions cleaned up and recreated successfully!';
    RAISE NOTICE 'You can now invite users without conflicts.';
END $$; 