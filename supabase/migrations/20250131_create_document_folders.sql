-- Create document folders table
CREATE TABLE IF NOT EXISTS document_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007aff', -- Hex color code for folder color
    icon VARCHAR(50) DEFAULT 'folder', -- Icon name for folder
    parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID, -- Optional: track who created the folder
    
    -- Ensure either facility_id or building_id is provided, not both
    CONSTRAINT folder_entity_check 
        CHECK ((facility_id IS NOT NULL AND building_id IS NULL) OR 
               (facility_id IS NULL AND building_id IS NOT NULL))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_folders_facility_id ON document_folders(facility_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_building_id ON document_folders(building_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_parent_folder_id ON document_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_sort_order ON document_folders(sort_order);

-- Add folder_id to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL;

-- Create index for folder_id in documents
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);

-- Create updated_at trigger for document_folders
CREATE OR REPLACE FUNCTION update_document_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_folders_updated_at
    BEFORE UPDATE ON document_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_document_folders_updated_at();

-- Add RLS policies for document folders
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage folders for their entities
CREATE POLICY "Users can manage document folders for their entities" ON document_folders
    FOR ALL USING (
        (facility_id IS NOT NULL AND facility_id IN (
            SELECT id FROM facilities 
            WHERE id = document_folders.facility_id
        )) OR
        (building_id IS NOT NULL AND building_id IN (
            SELECT id FROM buildings 
            WHERE id = document_folders.building_id
        ))
    );

-- Insert some default folders for each facility
INSERT INTO document_folders (facility_id, name, description, color, icon, sort_order)
SELECT 
    f.id,
    folder_name,
    folder_description,
    folder_color,
    folder_icon,
    folder_order
FROM facilities f
CROSS JOIN (
    VALUES 
        ('General Documents', 'General facility documents and files', '#007aff', 'folder', 1),
        ('Maintenance Records', 'Equipment maintenance logs and service records', '#00b16a', 'wrench', 2),
        ('Safety & Compliance', 'Safety protocols, compliance documents, and certifications', '#ff3b30', 'shield', 3),
        ('Financial Records', 'Invoices, contracts, and financial documents', '#ff9500', 'dollar-sign', 4),
        ('Building Plans', 'Architectural drawings, floor plans, and blueprints', '#5856d6', 'home', 5),
        ('Vendor Information', 'Vendor contracts, contact information, and documentation', '#af52de', 'users', 6),
        ('Insurance & Legal', 'Insurance policies, legal documents, and certificates', '#ff2d92', 'file-text', 7),
        ('Training Materials', 'Staff training documents and educational resources', '#32d74b', 'book-open', 8)
) AS default_folders(folder_name, folder_description, folder_color, folder_icon, folder_order)
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE document_folders IS 'Folders for organizing documents within facilities and buildings';
COMMENT ON COLUMN document_folders.facility_id IS 'Reference to facility (for facility-level folders)';
COMMENT ON COLUMN document_folders.building_id IS 'Reference to building (for building-level folders)';
COMMENT ON COLUMN document_folders.name IS 'Display name of the folder';
COMMENT ON COLUMN document_folders.description IS 'Optional description of the folder contents';
COMMENT ON COLUMN document_folders.color IS 'Hex color code for folder display';
COMMENT ON COLUMN document_folders.icon IS 'Icon name for folder display';
COMMENT ON COLUMN document_folders.parent_folder_id IS 'Reference to parent folder for nested folders';
COMMENT ON COLUMN document_folders.sort_order IS 'Order for displaying folders';
COMMENT ON COLUMN documents.folder_id IS 'Reference to the folder containing this document';





