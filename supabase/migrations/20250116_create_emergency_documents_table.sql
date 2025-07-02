-- Create emergency_documents table
CREATE TABLE emergency_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('emergency_plan', 'evacuation_routes', 'emergency_contacts', 'equipment', 'life_safety', 'floor_plans')),
    document_type VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    effective_date DATE,
    expiration_date DATE,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_emergency_documents_facility_id ON emergency_documents(facility_id);
CREATE INDEX idx_emergency_documents_category ON emergency_documents(category);
CREATE INDEX idx_emergency_documents_effective_date ON emergency_documents(effective_date);
CREATE INDEX idx_emergency_documents_expiration_date ON emergency_documents(expiration_date);
CREATE INDEX idx_emergency_documents_tags ON emergency_documents USING GIN(tags);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_emergency_documents_updated_at
    BEFORE UPDATE ON emergency_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE emergency_documents ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage their facility's emergency documents
CREATE POLICY "Users can manage emergency documents for their facilities" ON emergency_documents
    FOR ALL USING (
        facility_id IN (
            SELECT id FROM facilities 
            WHERE id = emergency_documents.facility_id
        )
    );

-- Add comments for documentation
COMMENT ON TABLE emergency_documents IS 'Emergency documentation and files for facilities';
COMMENT ON COLUMN emergency_documents.category IS 'Type of emergency document: emergency_plan, evacuation_routes, emergency_contacts, equipment, life_safety, floor_plans';
COMMENT ON COLUMN emergency_documents.tags IS 'JSON array of tags for categorization and search';
COMMENT ON COLUMN emergency_documents.effective_date IS 'Date when the document becomes effective';
COMMENT ON COLUMN emergency_documents.expiration_date IS 'Date when the document expires and needs renewal'; 