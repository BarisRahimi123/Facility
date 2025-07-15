'use server';

import { createClient } from '@supabase/supabase-js';

// Create service role client for database access
function getServiceRoleSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export interface EmergencyDocument {
  id: string;
  facility_id: string;
  name: string;
  description: string;
  category: 'emergency_plan' | 'evacuation_routes' | 'emergency_contacts' | 'equipment' | 'life_safety' | 'floor_plans';
  document_type: string;
  version: string;
  tags: string[];
  effective_date: string;
  expiration_date: string;
  file_url: string;
  file_size: number;
  file_name: string;
  created_at: string;
  updated_at: string;
}

// Get all emergency documents for a facility and category
export async function getEmergencyDocuments(facilityId: string, category?: string) {
  try {
    const supabase = getServiceRoleSupabase();
    
    let query = supabase
      .from('emergency_documents')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching emergency documents:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getEmergencyDocuments:', error);
    return [];
  }
}

// Upload new emergency document
export async function uploadEmergencyDocument(formData: FormData) {
  try {
    console.log('Starting emergency document upload...');
    const supabase = getServiceRoleSupabase();
    
    // Check if table exists first
    const tableCheck = await checkAndCreateEmergencyDocumentsTable();
    if (!tableCheck.success) {
      console.error('Failed to ensure table exists:', tableCheck.error);
      return { success: false, error: tableCheck.error };
    }
    
    // Extract form data
    const facilityId = formData.get('facilityId') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const documentType = formData.get('documentType') as string;
    const version = formData.get('version') as string;
    const tagsJson = formData.get('tags') as string;
    const effectiveDate = formData.get('effectiveDate') as string;
    const expirationDate = formData.get('expirationDate') as string;
    const file = formData.get('file') as File;
    
    console.log('Form data extracted:', {
      facilityId,
      name,
      category,
      documentType,
      version,
      fileSize: file?.size,
      fileName: file?.name
    });
    
    if (!facilityId || !name || !category || !documentType || !version || !file) {
      const missingFields = [];
      if (!facilityId) missingFields.push('facilityId');
      if (!name) missingFields.push('name');
      if (!category) missingFields.push('category');
      if (!documentType) missingFields.push('documentType');
      if (!version) missingFields.push('version');
      if (!file) missingFields.push('file');
      
      console.error('Missing required fields:', missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    const tags = JSON.parse(tagsJson || '[]');
    
    // For now, we'll store a placeholder file URL
    // TODO: Implement actual file upload to Supabase Storage
    const fileUrl = `/emergency-docs/${facilityId}/${category}/${file.name}`;
    
    // Insert document record
    const documentData = {
      facility_id: facilityId,
      name,
      description: description || '',
      category,
      document_type: documentType,
      version,
      tags,
      effective_date: effectiveDate || null,
      expiration_date: expirationDate || null,
      file_url: fileUrl,
      file_size: file.size,
      file_name: file.name
    };
    
    console.log('Attempting to insert document data:', documentData);
    
    const { data, error } = await supabase
      .from('emergency_documents')
      .insert(documentData)
      .select()
      .single();
    
    if (error) {
      console.error('Database error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Check if table doesn't exist
      if (error.code === '42P01') {
        throw new Error('Emergency documents table does not exist. Please run the database migration first.');
      }
      
      throw new Error(`Database error: ${error.message}`);
    }
    
    console.log('Emergency document uploaded successfully:', data);
    return { success: true, document: data };
  } catch (error) {
    console.error('Error in uploadEmergencyDocument:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload document' 
    };
  }
}

// Update emergency document
export async function updateEmergencyDocument(documentId: string, formData: FormData) {
  try {
    const supabase = getServiceRoleSupabase();
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const documentType = formData.get('documentType') as string;
    const version = formData.get('version') as string;
    const tagsJson = formData.get('tags') as string;
    const effectiveDate = formData.get('effectiveDate') as string;
    const expirationDate = formData.get('expirationDate') as string;
    
    const tags = JSON.parse(tagsJson || '[]');
    
    const updateData = {
      name,
      description,
      document_type: documentType,
      version,
      tags,
      effective_date: effectiveDate,
      expiration_date: expirationDate,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('emergency_documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating emergency document:', error);
      throw new Error('Failed to update document');
    }
    
    return { success: true, document: data };
  } catch (error) {
    console.error('Error in updateEmergencyDocument:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update document' 
    };
  }
}

// Delete emergency document
export async function deleteEmergencyDocument(documentId: string) {
  try {
    const supabase = getServiceRoleSupabase();
    
    // First get the document to find the file URL
    const { data: document, error: fetchError } = await supabase
      .from('emergency_documents')
      .select('file_url')
      .eq('id', documentId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching document for deletion:', fetchError);
      throw new Error('Document not found');
    }
    
    // Delete the database record
    const { error: deleteError } = await supabase
      .from('emergency_documents')
      .delete()
      .eq('id', documentId);
    
    if (deleteError) {
      console.error('Error deleting emergency document:', deleteError);
      throw new Error('Failed to delete document');
    }
    
    // TODO: Delete the actual file from Supabase Storage
    // const { error: storageError } = await supabase.storage
    //   .from('emergency-documents')
    //   .remove([document.file_url]);
    
    return { success: true };
  } catch (error) {
    console.error('Error in deleteEmergencyDocument:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete document' 
    };
  }
}

// Get document counts by category for a facility
export async function getEmergencyDocumentCounts(facilityId: string) {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data, error } = await supabase
      .from('emergency_documents')
      .select('category')
      .eq('facility_id', facilityId);
    
    if (error) {
      console.error('Error fetching document counts:', error);
      return {};
    }
    
    // Count documents by category
    const counts: Record<string, number> = {};
    data?.forEach(doc => {
      counts[doc.category] = (counts[doc.category] || 0) + 1;
    });
    
    return counts;
  } catch (error) {
    console.error('Error in getEmergencyDocumentCounts:', error);
    return {};
  }
}

// Check if emergency_documents table exists and create it if not
export async function checkAndCreateEmergencyDocumentsTable() {
  try {
    const supabase = getServiceRoleSupabase();
    
    // First, try to query the table to see if it exists
    const { data, error } = await supabase
      .from('emergency_documents')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('Emergency documents table does not exist. Creating it...');
      
      // Create the table
      const createTableSQL = `
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

        -- Create updated_at trigger function if it doesn't exist
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create trigger
        CREATE TRIGGER update_emergency_documents_updated_at
            BEFORE UPDATE ON emergency_documents
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        -- Add RLS policies
        ALTER TABLE emergency_documents ENABLE ROW LEVEL SECURITY;

        -- Policy for service role to bypass RLS
        CREATE POLICY "Service role can manage all emergency documents" ON emergency_documents
            FOR ALL TO service_role
            USING (true);
      `;
      
      const { error: createError } = await supabase.rpc('exec', { query: createTableSQL });
      
      if (createError) {
        console.error('Error creating emergency_documents table:', createError);
        return { success: false, error: `Failed to create table: ${createError.message}` };
      }
      
      console.log('Emergency documents table created successfully');
      return { success: true, message: 'Table created successfully' };
    } else if (error) {
      console.error('Error checking table existence:', error);
      return { success: false, error: error.message };
    } else {
      console.log('Emergency documents table already exists');
      return { success: true, message: 'Table already exists' };
    }
  } catch (error) {
    console.error('Error in checkAndCreateEmergencyDocumentsTable:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}            