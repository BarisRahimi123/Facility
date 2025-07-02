-- Fix Authentication Permissions for Sign-In
-- Run this in Supabase SQL Editor to fix the 500 errors

-- 1. Grant necessary permissions on user_invitations table
GRANT SELECT ON user_invitations TO authenticated;
GRANT SELECT ON user_invitations TO anon;

-- 2. Create a more permissive policy for reading during auth
CREATE POLICY "Allow public to check invitations during auth" ON user_invitations
    FOR SELECT
    USING (true);

-- 3. Ensure the users table has proper permissions
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- 4. Create/update policy to allow users to read their own data
CREATE POLICY "Users can read own data" ON users
    FOR SELECT
    USING (auth.uid() = id OR auth.email() = email);

-- 5. Create policy to allow reading user data during sign-in
CREATE POLICY "Allow reading user data during auth" ON users
    FOR SELECT
    USING (true);

-- 6. Drop any conflicting policies that might cause issues
DO $$
BEGIN
    -- Drop old policies if they exist
    DROP POLICY IF EXISTS "Users can view their sent invitations" ON user_invitations;
    DROP POLICY IF EXISTS "Master admins can view all invitations" ON user_invitations;
    DROP POLICY IF EXISTS "Users can create invitations based on role" ON user_invitations;
END $$;

-- 7. Recreate cleaner policies for user_invitations
CREATE POLICY "Authenticated users can view invitations" ON user_invitations
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create invitations if authorized" ON user_invitations
    FOR INSERT
    WITH CHECK (
        auth.uid() = invited_by AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('master_admin', 'sub_master')
        )
    );

-- 8. Verify the fix
SELECT 
    'Checking permissions...' as status,
    has_table_privilege('anon', 'users', 'SELECT') as anon_can_read_users,
    has_table_privilege('authenticated', 'users', 'SELECT') as auth_can_read_users,
    has_table_privilege('anon', 'user_invitations', 'SELECT') as anon_can_read_invitations,
    has_table_privilege('authenticated', 'user_invitations', 'SELECT') as auth_can_read_invitations; 