-- Add public/private visibility to facilities, buildings, rooms, and fields
-- This controls whether items appear on public facility maps for reservations

-- Add is_public column to facilities table
ALTER TABLE facilities 
ADD COLUMN is_public BOOLEAN DEFAULT false NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN facilities.is_public IS 'Controls whether facility appears on public maps for reservations. true = public (visible to all users), false = private (staff/admin only)';

-- Add is_public column to buildings table
ALTER TABLE buildings 
ADD COLUMN is_public BOOLEAN DEFAULT false NOT NULL;

COMMENT ON COLUMN buildings.is_public IS 'Controls whether building appears on public maps for reservations. true = public (visible to all users), false = private (staff/admin only)';

-- Add is_public column to rooms table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms') THEN
        ALTER TABLE rooms 
        ADD COLUMN is_public BOOLEAN DEFAULT false NOT NULL;
        
        EXECUTE 'COMMENT ON COLUMN rooms.is_public IS ''Controls whether room appears on public maps for reservations. true = public (visible to all users), false = private (staff/admin only)''';
    END IF;
END $$;

-- Add is_public column to fields table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fields') THEN
        ALTER TABLE fields 
        ADD COLUMN is_public BOOLEAN DEFAULT false NOT NULL;
        
        EXECUTE 'COMMENT ON COLUMN fields.is_public IS ''Controls whether field appears on public maps for reservations. true = public (visible to all users), false = private (staff/admin only)''';
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_facilities_is_public ON facilities(is_public) WHERE is_public = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_buildings_is_public ON buildings(is_public) WHERE is_public = true;

-- Create indexes for fields and rooms if tables exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_is_public ON rooms(is_public) WHERE is_public = true';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fields') THEN
        EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fields_is_public ON fields(is_public) WHERE is_public = true';
    END IF;
END $$;

-- Update RLS policies to consider visibility
-- Note: This assumes existing RLS policies exist and need to be updated
-- Facilities RLS policy update
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Enable read access for all users" ON facilities;
    
    -- Create new policy that considers public visibility
    CREATE POLICY "Enable read access for public facilities and authenticated users for all facilities" 
    ON facilities FOR SELECT 
    USING (
        is_public = true OR 
        auth.role() = 'authenticated'
    );
END $$;

-- Buildings RLS policy update  
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buildings') THEN
        -- Drop existing policy if it exists
        EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON buildings';
        
        -- Create new policy
        EXECUTE 'CREATE POLICY "Enable read access for public buildings and authenticated users for all buildings" 
        ON buildings FOR SELECT 
        USING (
            is_public = true OR 
            auth.role() = ''authenticated''
        )';
    END IF;
END $$;

-- Rooms RLS policy update
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON rooms';
        EXECUTE 'CREATE POLICY "Enable read access for public rooms and authenticated users for all rooms" 
        ON rooms FOR SELECT 
        USING (
            is_public = true OR 
            auth.role() = ''authenticated''
        )';
    END IF;
END $$;

-- Fields RLS policy update
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fields') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON fields';
        EXECUTE 'CREATE POLICY "Enable read access for public fields and authenticated users for all fields" 
        ON fields FOR SELECT 
        USING (
            is_public = true OR 
            auth.role() = ''authenticated''
        )';
    END IF;
END $$;