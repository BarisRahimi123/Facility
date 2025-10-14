-- Quick fix for invitation role mismatch
-- Updates the can_invite_user function to recognize sub_admin instead of sub_master

-- Drop and recreate can_invite_user with correct role names
DROP FUNCTION IF EXISTS can_invite_user CASCADE;

CREATE OR REPLACE FUNCTION can_invite_user(inviter_role text, invitee_role text)
RETURNS BOOLEAN AS $$
BEGIN
    -- Master admin can invite sub admins
    IF inviter_role = 'master_admin' THEN
        RETURN invitee_role IN ('sub_admin', 'staff');
    END IF;
    
    -- Sub admin can invite staff  
    IF inviter_role = 'sub_admin' THEN
        RETURN invitee_role = 'staff';
    END IF;
    
    -- Legacy role support
    -- district_approver is now master_admin
    IF inviter_role = 'district_approver' THEN
        RETURN invitee_role IN ('sub_admin', 'staff');
    END IF;
    
    -- site_approver, manager, coordinator are now sub_admin
    IF inviter_role IN ('site_approver', 'manager', 'coordinator', 'sub_master') THEN
        RETURN invitee_role = 'staff';
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_invite_user TO authenticated;

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated can_invite_user function';
    RAISE NOTICE 'Now supports: master_admin -> sub_admin -> staff hierarchy';
END
$$;







