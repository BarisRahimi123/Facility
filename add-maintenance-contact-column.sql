-- Add maintenance_contact column to building_systems table
ALTER TABLE building_systems 
ADD COLUMN IF NOT EXISTS maintenance_contact JSONB;

-- Add comment for the new column
COMMENT ON COLUMN building_systems.maintenance_contact IS 'Contact information for maintenance reminders (name, email, phone, company)';

-- Test the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'building_systems' 
AND column_name = 'maintenance_contact'; 