# Invitation Function Troubleshooting Guide

## The Issue

You're seeing an error when trying to fix the `send_user_invitation` function. This is likely due to one of several common issues:

1. **Function signature mismatch** - The DROP statement is trying to drop a function with specific parameter types that don't match what's in the database
2. **Dependencies** - Other database objects depend on the function
3. **Permissions** - Insufficient permissions to drop/create functions
4. **Data type conflicts** - The `user_role` enum vs text type mismatch

## Quick Fix

Run this safer script that uses CASCADE and handles edge cases:

```sql
-- scripts/fix-invitation-function-safe.sql
```

## Step-by-Step Diagnosis

### 1. First, check what functions exist:

```sql
-- Run this in Supabase SQL Editor
SELECT 
    p.oid,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'send_user_invitation'
    AND n.nspname = 'public';
```

### 2. Check the exact error

The error might be one of:
- `ERROR: function send_user_invitation(text, user_role, uuid, uuid) does not exist`
- `ERROR: cannot drop function send_user_invitation because other objects depend on it`
- `ERROR: type "user_role" does not exist`

### 3. If you see "function does not exist" error:

This means the function signature in your DROP statement doesn't match. Try:

```sql
-- Drop using CASCADE to handle any dependencies
DROP FUNCTION IF EXISTS public.send_user_invitation CASCADE;
```

### 4. If you see dependency errors:

Check what depends on the function:

```sql
SELECT DISTINCT
    d.classid::regclass AS dependency_type,
    d.objid::regprocedure AS dependent_object
FROM pg_depend d
JOIN pg_proc p ON d.refobjid = p.oid
WHERE p.proname = 'send_user_invitation';
```

### 5. If you see type errors:

The `user_role` enum might not match. Use text instead:

```sql
-- Check if user_role type exists
SELECT typname FROM pg_type WHERE typname = 'user_role';

-- Check column types in user_invitations
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'user_invitations' 
AND column_name = 'role';
```

## Complete Safe Solution

Use the `scripts/fix-invitation-function-safe.sql` file which:

1. Uses `CASCADE` to handle dependencies
2. Creates the table if it doesn't exist
3. Uses `text` type instead of `user_role` enum for flexibility
4. Includes proper error handling
5. Sets up all necessary permissions and policies

## To Apply the Fix:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `scripts/fix-invitation-function-safe.sql`
4. Paste and run the script
5. You should see success messages in the output

## Common Errors and Solutions:

### Error: "column 'role' is of type user_role but expression is of type text"

Solution: The table uses enum but function uses text. Either:
- Change the table column to text
- Cast the value in the function: `p_role::user_role`

### Error: "permission denied for function send_user_invitation"

Solution: Make sure you're running as a superuser or add:
```sql
GRANT EXECUTE ON FUNCTION send_user_invitation TO current_user;
```

### Error: "relation 'organizations' does not exist"

Solution: Remove the organization_id references or create the organizations table first.

## Testing After Fix

Test the function works:

```sql
-- Test calling the function (will fail with "Inviter not found" but proves function exists)
SELECT send_user_invitation(
    'test@example.com',
    'staff',
    '00000000-0000-0000-0000-000000000000'::uuid
);
```

## If All Else Fails

Create a minimal version without dependencies:

```sql
DROP FUNCTION IF EXISTS send_user_invitation CASCADE;

CREATE FUNCTION send_user_invitation(
    p_email text,
    p_role text,
    p_invited_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Function recreated - needs full implementation'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION send_user_invitation TO authenticated;
```

Then gradually add back the full functionality. 