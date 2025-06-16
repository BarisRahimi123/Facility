-- Add default values to documents table columns
ALTER TABLE documents 
  ALTER COLUMN category SET DEFAULT 'General',
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Make sure version has a default
ALTER TABLE documents 
  ALTER COLUMN version SET DEFAULT 1;

-- Update any existing NULL values
UPDATE documents 
SET category = 'General' 
WHERE category IS NULL;

UPDATE documents 
SET created_at = now() 
WHERE created_at IS NULL;

UPDATE documents 
SET updated_at = now() 
WHERE updated_at IS NULL; 