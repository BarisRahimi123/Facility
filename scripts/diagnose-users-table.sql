-- Diagnostic script to understand the current users table structure

-- 1. Check if users table exists and show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Show any existing data in users table
SELECT COUNT(*) as total_users FROM users;

-- 3. Show existing users (first 5)
SELECT id, email, 
       CASE 
         WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') 
         THEN (SELECT name FROM users u2 WHERE u2.id = users.id LIMIT 1)
         ELSE 'N/A'
       END as name_column,
       CASE 
         WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') 
         THEN (SELECT full_name FROM users u2 WHERE u2.id = users.id LIMIT 1)
         ELSE 'N/A'
       END as full_name_column,
       role, is_active
FROM users 
LIMIT 5;

-- 4. Check if our target user already exists
SELECT id, email, role, is_active, created_at
FROM users 
WHERE email = '85baris@gmail.com';

-- 5. Check table constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users'
AND tc.table_schema = 'public';

-- 6. Check if organizations table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'organizations' 
    AND table_schema = 'public'
) as organizations_table_exists;
