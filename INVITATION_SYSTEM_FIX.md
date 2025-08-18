# Invitation System Fix for Sub-Master Users

## Issue
When trying to send an invitation for a Sub-Master Admin user, the system fails with an error. This is due to a mismatch between the frontend using `sub_admin` and the database function `can_invite_user` expecting `sub_master`.

## Root Cause
The three-tier authentication migration (`20250131_three_tier_authentication.sql`) changed the user_role enum from using `sub_master` to `sub_admin`, but the invitation permission functions were not updated accordingly.

## Solution

### Step 1: Apply the Database Fix
Run the following SQL in your Supabase SQL Editor:

```sql
-- Quick fix for invitation role mismatch
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
    IF inviter_role = 'district_approver' THEN
        RETURN invitee_role IN ('sub_admin', 'staff');
    END IF;
    
    IF inviter_role IN ('site_approver', 'manager', 'coordinator', 'sub_master') THEN
        RETURN invitee_role = 'staff';
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION can_invite_user TO authenticated;
```

### Step 2: Test the Fix
After applying the SQL fix, test the invitation system:

1. **As Master Admin:**
   - Go to People page
   - Click "Add Sub-Master Admin"
   - Fill in the form with:
     - Email: test-submaster@example.com
     - Full Name: Test Sub Master
     - Phone: (555) 123-4567
     - Organization Name: Test Organization
   - Click "Send Invitation"

2. **As Sub-Master Admin:**
   - Go to People page
   - Click "Add Staff"
   - Fill in the form with staff details
   - Click "Send Invitation"

### Step 3: Debug if Still Not Working
If you still get errors, run this diagnostic SQL to check the system state:

```sql
-- Check user roles enum
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'user_role'::regtype::oid
ORDER BY enumsortorder;

-- Test permission checks
SELECT 
    'master_admin -> sub_admin' as test_case,
    can_invite_user('master_admin', 'sub_admin') as result
UNION ALL
SELECT 
    'sub_admin -> staff' as test_case,
    can_invite_user('sub_admin', 'staff') as result;

-- Check your current user role
SELECT id, email, role 
FROM users 
WHERE email = 'YOUR_EMAIL_HERE';
```

## Role Hierarchy
The correct three-tier hierarchy is:
1. **master_admin** - Can invite sub_admin and staff
2. **sub_admin** - Can only invite staff
3. **staff** - Cannot invite anyone

## Files Involved
- **Frontend:** `src/components/people/InviteUserModal.tsx` - Correctly uses `sub_admin`
- **Database:** `can_invite_user` function - Needs to be updated to use `sub_admin`
- **Migration:** `20250131_three_tier_authentication.sql` - Changed enum to use `sub_admin`

## Additional Scripts Created
- `scripts/quick-fix-invitation-roles.sql` - Quick fix for the issue
- `scripts/fix-invitation-roles-three-tier.sql` - Complete fix with all functions
- `scripts/test-invitation-system.sql` - Diagnostic queries to test the system




