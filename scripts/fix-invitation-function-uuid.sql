-- Alternative invitation function using UUID instead of gen_random_bytes
-- This works without pgcrypto extension

-- Drop existing function
DROP FUNCTION IF EXISTS send_user_invitation(text, text, uuid, uuid, uuid, jsonb);

-- Create function with UUID-based token
CREATE OR REPLACE FUNCTION send_user_invitation(
  p_email text,
  p_role text,
  p_invited_by uuid,
  p_facility_id uuid DEFAULT NULL,
  p_organization_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_invitation_id uuid;
  v_token text;
  v_existing_user_id uuid;
  v_inviter_role text;
  v_inviter_org_id uuid;
BEGIN
  -- Get inviter's role and organization
  SELECT user_role, organization_id INTO v_inviter_role, v_inviter_org_id
  FROM users
  WHERE id = p_invited_by;

  -- Check if inviter can invite this role
  IF NOT can_invite_user(v_inviter_role, p_role) THEN
    RAISE EXCEPTION 'You do not have permission to invite users with role %', p_role;
  END IF;

  -- Check if user already exists
  SELECT id INTO v_existing_user_id
  FROM users
  WHERE email = lower(p_email);

  IF v_existing_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'A user with email % already exists', p_email;
  END IF;

  -- Check for existing pending invitation
  SELECT id INTO v_invitation_id
  FROM user_invitations
  WHERE email = lower(p_email)
    AND status = 'pending'
    AND expires_at > now();

  IF v_invitation_id IS NOT NULL THEN
    RAISE EXCEPTION 'An invitation has already been sent to %', p_email;
  END IF;

  -- Generate token using UUID (alternative to gen_random_bytes)
  v_token := md5(random()::text || clock_timestamp()::text || p_email)::uuid::text || 
             md5(random()::text || clock_timestamp()::text)::uuid::text;

  -- Set organization_id based on inviter's role
  IF v_inviter_role = 'master_admin' THEN
    -- Master admin can specify any organization or use provided one
    p_organization_id := COALESCE(p_organization_id, v_inviter_org_id);
  ELSE
    -- Other roles must use their own organization
    p_organization_id := v_inviter_org_id;
  END IF;

  -- Create invitation
  INSERT INTO user_invitations (
    email,
    role,
    token,
    invited_by,
    facility_id,
    organization_id,
    metadata,
    expires_at
  ) VALUES (
    lower(p_email),
    p_role,
    v_token,
    p_invited_by,
    p_facility_id,
    p_organization_id,
    p_metadata,
    now() + interval '7 days'
  ) RETURNING id INTO v_invitation_id;

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'email', p_email,
    'role', p_role,
    'token', v_token,
    'expires_at', (now() + interval '7 days')::text
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create invitation: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION send_user_invitation TO authenticated;

-- Test the function
SELECT 'Functions updated to use UUID-based tokens!' as status; 