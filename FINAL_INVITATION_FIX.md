# FINAL FIX: Add sub_admin to user_role enum

## Problem
The `user_role` enum is missing `sub_admin`. Current enum values: `renter`, `manager`, `staff`, `master_admin`

## Solution
Run this SQL in your Supabase SQL Editor:

```sql
-- Add sub_admin to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sub_admin';

-- Verify the enum values
SELECT unnest(enum_range(NULL::user_role)) AS role_value;
```

## Verification Test
After adding the enum value, this should work:

```sql
SELECT send_user_invitation(
    'test-submaster@example.com',
    'sub_admin',
    'd73d82d8-27f5-4c78-9c4b-978c272069b8'::uuid,
    NULL,
    NULL,
    '{}',
    '{"fullName": "Test Sub Master"}'::jsonb
);
```

## Current Status
- ✅ Invitation function - Fixed
- ✅ Permission checking - Working
- ❌ sub_admin enum value - Missing
- ✅ All other roles - Working

After this fix, sub-master user invitations will work perfectly!
