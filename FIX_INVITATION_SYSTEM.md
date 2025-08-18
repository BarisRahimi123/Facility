# URGENT: Fix Invitation System for Sub-Master Users

## Problem
The invitation system is failing because the `send_user_invitation` function is trying to call `can_invite_user(user_role, user_role)` but only `can_invite_user(text, text)` exists.

## Solution
Apply this SQL in your Supabase SQL Editor:

```sql
-- Create overloaded version for enum types
CREATE OR REPLACE FUNCTION can_invite_user(inviter_role user_role, invitee_role user_role)
RETURNS boolean AS $$
BEGIN
    RETURN can_invite_user(inviter_role::text, invitee_role::text);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_invite_user(user_role, user_role) TO authenticated;
```

## Steps to Apply
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Paste the above SQL code
4. Click "Run" to execute

## Verification
After applying the fix, test the invitation system:

```sql
-- Test the function
SELECT send_user_invitation(
    'test-submaster@example.com',
    'sub_admin',
    'd73d82d8-27f5-4c78-9c4b-978c272069b8'::uuid,
    NULL,
    NULL,
    '{}',
    '{"fullName": "Test Sub Master", "phone": "(555) 123-4567"}'
);
```

## Current Status
- ✅ `can_invite_user(text, text)` - Working
- ❌ `can_invite_user(user_role, user_role)` - Missing (needed by send_user_invitation)
- ❌ `send_user_invitation` - Failing due to missing function

## After Fix
The invitation system should work properly for:
- Master admin inviting sub-master admin
- Sub-master admin inviting staff
- All invitation acceptance flows
