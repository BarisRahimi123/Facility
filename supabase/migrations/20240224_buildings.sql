-- Create enum types for building status and building types
CREATE TYPE building_status AS ENUM ('active', 'inactive', 'maintenance');
CREATE TYPE building_type AS ENUM ('Classroom', 'Cafeteria', 'Gymnasium', 'Administration', 'Library', 'Laboratory', 'Auditorium', 'Other');
CREATE TYPE renovation_status AS ENUM ('planning', 'in_progress', 'completed', 'on_hold');
CREATE TYPE dsa_approval_status AS ENUM ('approved', 'pending', 'not_required');

-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    building_number TEXT,
    construction_date DATE NOT NULL,
    building_type building_type NOT NULL,
    square_footage NUMERIC NOT NULL CHECK (square_footage > 0),
    number_of_rooms INTEGER NOT NULL CHECK (number_of_rooms >= 0),
    status building_status NOT NULL DEFAULT 'active',
    dsa_number TEXT,
    linked_plan_folders TEXT[],
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create renovations table to handle the renovations array
CREATE TABLE IF NOT EXISTS building_renovations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    date DATE,
    scope_of_work TEXT NOT NULL,
    square_footage_affected NUMERIC NOT NULL CHECK (square_footage_affected > 0),
    start_date DATE NOT NULL,
    completion_date DATE NOT NULL,
    status renovation_status NOT NULL,
    funding_source TEXT NOT NULL,
    dsa_approval_status dsa_approval_status NOT NULL,
    inspector_name TEXT NOT NULL,
    inspector_contact TEXT NOT NULL,
    estimated_budget NUMERIC NOT NULL,
    final_cost NUMERIC,
    contractor_name TEXT NOT NULL,
    contractor_phone TEXT NOT NULL,
    contractor_email TEXT NOT NULL,
    architect_firm_name TEXT,
    architect_firm_contact TEXT,
    project_manager_name TEXT NOT NULL,
    project_manager_department TEXT NOT NULL,
    project_manager_contact TEXT NOT NULL,
    maintenance_plan TEXT NOT NULL,
    notes TEXT,
    lessons_learned TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create change orders table
CREATE TABLE IF NOT EXISTS renovation_change_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renovation_id UUID NOT NULL REFERENCES building_renovations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    cost_adjustment NUMERIC NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create warranties table
CREATE TABLE IF NOT EXISTS renovation_warranties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    renovation_id UUID NOT NULL REFERENCES building_renovations(id) ON DELETE CASCADE,
    item TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_buildings_updated_at
    BEFORE UPDATE ON buildings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_building_renovations_updated_at
    BEFORE UPDATE ON building_renovations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_buildings_facility_id ON buildings(facility_id);
CREATE INDEX idx_buildings_building_type ON buildings(building_type);
CREATE INDEX idx_buildings_status ON buildings(status);
CREATE INDEX idx_building_renovations_building_id ON building_renovations(building_id);
CREATE INDEX idx_renovation_change_orders_renovation_id ON renovation_change_orders(renovation_id);
CREATE INDEX idx_renovation_warranties_renovation_id ON renovation_warranties(renovation_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_renovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_warranties ENABLE ROW LEVEL SECURITY;

-- Create policies for buildings
CREATE POLICY "Enable read access for authenticated users" ON buildings
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON buildings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update for building owners" ON buildings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Create policies for renovations and related tables
CREATE POLICY "Enable all access for authenticated users" ON building_renovations
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM buildings
        WHERE buildings.id = building_renovations.building_id
        AND buildings.created_by = auth.uid()
    ));

CREATE POLICY "Enable all access for authenticated users" ON renovation_change_orders
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM building_renovations
        JOIN buildings ON buildings.id = building_renovations.building_id
        WHERE building_renovations.id = renovation_change_orders.renovation_id
        AND buildings.created_by = auth.uid()
    ));

CREATE POLICY "Enable all access for authenticated users" ON renovation_warranties
    FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM building_renovations
        JOIN buildings ON buildings.id = building_renovations.building_id
        WHERE building_renovations.id = renovation_warranties.renovation_id
        AND buildings.created_by = auth.uid()
    )); 