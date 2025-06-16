-- Create maintenance table
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    building_system_id UUID NOT NULL REFERENCES building_systems(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    maintenance_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'semi-annual', 'annual', 'as-needed')),
    installation_date DATE NOT NULL,
    next_maintenance_date DATE,
    last_completed_date DATE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'overdue', 'cancelled')),
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_maintenance_building_system ON maintenance_schedules(building_system_id);
CREATE INDEX idx_maintenance_next_date ON maintenance_schedules(next_maintenance_date);
CREATE INDEX idx_maintenance_status ON maintenance_schedules(status);

-- Add RLS policies
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing maintenance schedules
CREATE POLICY "Enable read access for authenticated users" ON maintenance_schedules
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for inserting maintenance schedules
CREATE POLICY "Enable insert access for authenticated users" ON maintenance_schedules
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for updating maintenance schedules
CREATE POLICY "Enable update access for authenticated users" ON maintenance_schedules
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy for deleting maintenance schedules
CREATE POLICY "Enable delete access for authenticated users" ON maintenance_schedules
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update next_maintenance_date based on frequency
CREATE OR REPLACE FUNCTION calculate_next_maintenance_date(
    installation_date DATE,
    frequency VARCHAR
) RETURNS DATE AS $$
BEGIN
    CASE frequency
        WHEN 'weekly' THEN
            RETURN installation_date + INTERVAL '7 days';
        WHEN 'monthly' THEN
            RETURN installation_date + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            RETURN installation_date + INTERVAL '3 months';
        WHEN 'semi-annual' THEN
            RETURN installation_date + INTERVAL '6 months';
        WHEN 'annual' THEN
            RETURN installation_date + INTERVAL '1 year';
        ELSE
            RETURN NULL; -- For 'as-needed'
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update next_maintenance_date
CREATE OR REPLACE FUNCTION update_next_maintenance_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.frequency != 'as-needed' THEN
        NEW.next_maintenance_date := calculate_next_maintenance_date(NEW.installation_date, NEW.frequency);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_next_maintenance_date
    BEFORE INSERT OR UPDATE ON maintenance_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_next_maintenance_date();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON maintenance_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp(); 