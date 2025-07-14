-- 1. Check what functions exist with this name
SELECT 
    p.oid,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'send_user_invitation'
    AND n.nspname = 'public'
ORDER BY p.oid;

-- 2. Check dependencies on these functions
SELECT DISTINCT
    d.classid::regclass AS dependency_type,
    CASE 
        WHEN d.classid::regclass::text = 'pg_proc' THEN d.objid::regprocedure::text
        ELSE d.objid::text
    END AS dependent_object
FROM pg_depend d
JOIN pg_proc p ON d.refobjid = p.oid
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'send_user_invitation'
    AND n.nspname = 'public'
    AND d.deptype = 'n';

-- 3. Check user_invitations table structure
SELECT 
    column_name, 
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_invitations'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check if can_invite_user function exists
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'can_invite_user'
    AND n.nspname = 'public';

-- 5. Get the exact definition of existing send_user_invitation function(s)
SELECT pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'send_user_invitation'
    AND n.nspname = 'public';

-- 6. Check grants on the function
SELECT 
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'send_user_invitation'
    AND routine_schema = 'public'; 