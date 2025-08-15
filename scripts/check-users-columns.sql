-- Check the actual columns in the users table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Also check a sample user record
SELECT * FROM users WHERE email = '85baris@gmail.com' LIMIT 1; 