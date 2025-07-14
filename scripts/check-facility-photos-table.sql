-- Check if facility_photos table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'facility_photos'
) AS table_exists;

-- If table exists, show its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'facility_photos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if storage bucket exists
SELECT id, name, public
FROM storage.buckets 
WHERE id = 'facility-photos';
