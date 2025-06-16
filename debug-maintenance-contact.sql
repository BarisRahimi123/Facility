-- Check if maintenance_contact column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'building_systems' 
AND column_name = 'maintenance_contact';

-- Check current building systems data
SELECT id, name, system_type, maintenance_contact
FROM building_systems
ORDER BY created_at DESC
LIMIT 5;

-- Check the structure of building_systems table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'building_systems'
ORDER BY ordinal_position; 