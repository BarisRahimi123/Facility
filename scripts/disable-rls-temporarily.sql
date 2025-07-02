-- Temporarily disable RLS to test if that's causing the 500 errors
-- Run this in Supabase SQL Editor

-- 1. Disable RLS on user_invitations temporarily
ALTER TABLE user_invitations DISABLE ROW LEVEL SECURITY;

-- 2. Check if users table has RLS enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_invitations');

-- 3. If this fixes the sign-in, we know RLS policies are the issue
-- You can re-enable RLS later with proper policies:
-- ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY; 