-- Fix the send_user_invitation function to resolve ambiguous token column
DROP FUNCTION IF EXISTS send_user_invitation(text, text, uuid, uuid, uuid, jsonb);

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION send_user_invitation TO authenticated;

-- Also fix the accept_invitation function if it exists
DROP FUNCTION IF EXISTS accept_invitation(text, text);

CREATE OR REPLACE FUNCTION accept_invitation(
  p_token text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
  v_user_id uuid;
BEGIN
  -- Get invitation details (explicitly specify table for token)
  SELECT * INTO v_invitation
  FROM user_invitations
  WHERE user_invitations.token = p_token
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION accept_invitation TO anon, authenticated; 