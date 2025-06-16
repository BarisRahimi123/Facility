-- Update tasks table schema
ALTER TABLE tasks
  ALTER COLUMN title TYPE TEXT,
  ALTER COLUMN description TYPE TEXT,
  ALTER COLUMN type TYPE TEXT,
  ALTER COLUMN priority TYPE TEXT,
  ALTER COLUMN status TYPE TEXT,
  ALTER COLUMN workflow_status TYPE TEXT,
  ALTER COLUMN created_by TYPE TEXT,
  ALTER COLUMN updated_by TYPE TEXT,
  ALTER COLUMN location TYPE TEXT,
  ALTER COLUMN system_type TYPE TEXT,
  ALTER COLUMN issue_type TYPE TEXT,
  ALTER COLUMN impact TYPE TEXT,
  ALTER COLUMN severity TYPE TEXT,
  ALTER COLUMN facility_id TYPE TEXT,
  ALTER COLUMN building_id TYPE TEXT,
  ALTER COLUMN room_id TYPE TEXT;

-- Ensure submitter_info column exists and is JSONB
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' 
    AND column_name = 'submitter_info'
  ) THEN
    ALTER TABLE tasks ADD COLUMN submitter_info JSONB DEFAULT '{}';
  END IF;
END $$;

-- Update column defaults
ALTER TABLE tasks
  ALTER COLUMN priority SET DEFAULT 'medium',
  ALTER COLUMN status SET DEFAULT 'new',
  ALTER COLUMN workflow_status SET DEFAULT 'new',
  ALTER COLUMN impact SET DEFAULT 'low',
  ALTER COLUMN severity SET DEFAULT 'low',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN estimated_duration SET DEFAULT 60;

-- Add NOT NULL constraints where appropriate
ALTER TABLE tasks
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN priority SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN workflow_status SET NOT NULL,
  ALTER COLUMN start_date SET NOT NULL,
  ALTER COLUMN estimated_duration SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN updated_by SET NOT NULL,
  ALTER COLUMN location SET NOT NULL,
  ALTER COLUMN system_type SET NOT NULL,
  ALTER COLUMN issue_type SET NOT NULL,
  ALTER COLUMN impact SET NOT NULL,
  ALTER COLUMN severity SET NOT NULL; 