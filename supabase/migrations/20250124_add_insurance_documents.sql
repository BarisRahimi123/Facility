-- =====================================================
-- ADD INSURANCE DOCUMENT FIELDS
-- Migration to support insurance document uploads
-- =====================================================

-- Add insurance document fields to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS insurance_documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS insurance_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS insurance_status TEXT DEFAULT 'pending' CHECK (insurance_status IN ('pending', 'submitted', 'approved', 'deficient', 'waived')),
ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
ADD COLUMN IF NOT EXISTS insurance_notes TEXT;

-- Add insurance document fields to users table for individual renters
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS insurance_documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS insurance_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS insurance_status TEXT DEFAULT 'pending' CHECK (insurance_status IN ('pending', 'submitted', 'approved', 'deficient', 'waived')),
ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE,
ADD COLUMN IF NOT EXISTS insurance_notes TEXT;

-- Create insurance_documents table for better organization
CREATE TABLE IF NOT EXISTS insurance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('organization', 'user')),
  entity_id UUID NOT NULL,
  document_type TEXT NOT NULL, -- 'liability', 'property', 'workers_comp', 'certificate', 'other'
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  coverage_amount DECIMAL(10,2),
  expiry_date DATE,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'expired')),
  uploaded_by UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_insurance_documents_entity ON insurance_documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_insurance_documents_status ON insurance_documents(status);
CREATE INDEX IF NOT EXISTS idx_insurance_documents_expiry ON insurance_documents(expiry_date);

-- Add foreign key constraints
ALTER TABLE insurance_documents 
ADD CONSTRAINT fk_insurance_org 
FOREIGN KEY (entity_id) REFERENCES organizations(id) ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;

-- Create storage bucket for insurance documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('insurance-documents', 'insurance-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for insurance documents
ALTER TABLE insurance_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own organization's documents
CREATE POLICY insurance_documents_select_policy ON insurance_documents
  FOR SELECT USING (
    entity_type = 'organization' AND entity_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR
    entity_type = 'user' AND entity_id = auth.uid()
  );

-- Policy: Users can insert documents for their organization or themselves
CREATE POLICY insurance_documents_insert_policy ON insurance_documents
  FOR INSERT WITH CHECK (
    entity_type = 'organization' AND entity_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR
    entity_type = 'user' AND entity_id = auth.uid()
  );

-- Policy: Users can update their own documents
CREATE POLICY insurance_documents_update_policy ON insurance_documents
  FOR UPDATE USING (
    entity_type = 'organization' AND entity_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR
    entity_type = 'user' AND entity_id = auth.uid()
  );

-- Policy: Users can delete their own documents
CREATE POLICY insurance_documents_delete_policy ON insurance_documents
  FOR DELETE USING (
    entity_type = 'organization' AND entity_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR
    entity_type = 'user' AND entity_id = auth.uid()
  );

-- Storage policies for insurance documents bucket
CREATE POLICY "Users can upload insurance documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'insurance-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view their insurance documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'insurance-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their insurance documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'insurance-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their insurance documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'insurance-documents' AND
    auth.role() = 'authenticated'
  );

-- Sample insurance document types for reference
INSERT INTO insurance_documents (entity_type, entity_id, document_type, document_name, file_url, storage_path, file_name, file_type, coverage_amount, expiry_date)
VALUES 
-- Note: These are sample entries that will need real entity_ids when organizations exist
('organization', gen_random_uuid(), 'liability', 'General Liability Certificate', 'https://example.com/cert1.pdf', 'insurance-documents/org1/cert1.pdf', 'general-liability-2024.pdf', 'application/pdf', 1000000, '2024-12-31'),
('organization', gen_random_uuid(), 'property', 'Property Insurance', 'https://example.com/cert2.pdf', 'insurance-documents/org2/cert2.pdf', 'property-insurance-2024.pdf', 'application/pdf', 500000, '2024-11-30')
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE insurance_documents IS 'Stores insurance document metadata for organizations and users';
COMMENT ON COLUMN insurance_documents.entity_type IS 'Type of entity: organization or user';
COMMENT ON COLUMN insurance_documents.entity_id IS 'ID of the organization or user';
COMMENT ON COLUMN insurance_documents.document_type IS 'Type of insurance: liability, property, workers_comp, certificate, other';
COMMENT ON COLUMN insurance_documents.coverage_amount IS 'Insurance coverage amount in dollars';
COMMENT ON COLUMN insurance_documents.expiry_date IS 'When the insurance policy expires';
COMMENT ON COLUMN insurance_documents.status IS 'Document review status: submitted, approved, rejected, expired'; 