-- Update rooms table to match application expectations
-- First, drop the existing rooms table if it exists
DROP TABLE IF EXISTS rooms CASCADE;

-- Create the updated rooms table with proper columns
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    room_function TEXT NOT NULL,
    square_footage INTEGER NOT NULL CHECK (square_footage > 0),
    capacity INTEGER,
    floor TEXT,
    furniture_details JSONB,
    accessibility_notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_rooms_building_id ON rooms(building_id);
CREATE INDEX idx_rooms_room_function ON rooms(room_function);
CREATE INDEX idx_rooms_floor ON rooms(floor);

-- Create updated_at trigger
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms
CREATE POLICY "Enable read access for authenticated users" ON rooms
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON rooms
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON rooms
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON rooms
    FOR DELETE
    TO authenticated
    USING (true); 