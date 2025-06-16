-- Add facility_id column to documents table
ALTER TABLE documents ADD COLUMN facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;

-- Create index for facility_id
CREATE INDEX idx_documents_facility_id ON documents(facility_id);
 
-- Update the constraint to make either building_id or facility_id required
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_building_id_check;
ALTER TABLE documents ADD CONSTRAINT documents_entity_check 
  CHECK ((building_id IS NOT NULL AND facility_id IS NULL) OR (building_id IS NULL AND facility_id IS NOT NULL)); 