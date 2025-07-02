'use server';

import { createClient } from '@/lib/supabase/server';

export interface InsuranceDocument {
  id: string;
  entity_type: 'organization' | 'user';
  entity_id: string;
  document_type: 'liability' | 'property' | 'workers_comp' | 'certificate' | 'other';
  document_name: string;
  file_url: string;
  storage_path: string;
  file_name: string;
  file_type?: string;
  file_size?: number;
  coverage_amount?: number;
  expiry_date?: string;
  status: 'submitted' | 'approved' | 'rejected' | 'expired';
  uploaded_by?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInsuranceDocumentData {
  entity_type: 'organization' | 'user';
  entity_id: string;
  document_type: 'liability' | 'property' | 'workers_comp' | 'certificate' | 'other';
  document_name: string;
  file: File;
  coverage_amount?: number;
  expiry_date?: string;
  notes?: string;
}

export interface InsuranceDocumentResponse {
  data: InsuranceDocument[] | InsuranceDocument | null;
  error: string | null;
}

// Upload insurance document
export async function uploadInsuranceDocument(documentData: CreateInsuranceDocumentData): Promise<InsuranceDocumentResponse> {
  try {
    const supabase = await createClient();

    const { file, entity_type, entity_id, document_type, document_name, coverage_amount, expiry_date, notes } = documentData;

    // Validate file type (PDF, images)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return { data: null, error: 'Invalid file type. Please upload PDF, JPEG, or PNG files only.' };
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return { data: null, error: `File size exceeds limit of 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB` };
    }

    // Generate file path
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileName = `${document_type}-${timestamp}-${randomId}.${fileExt}`;
    const filePath = `insurance-documents/${entity_type}/${entity_id}/${fileName}`;

    console.log('Uploading insurance document to:', filePath);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('insurance-documents')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { data: null, error: `Failed to upload file: ${uploadError.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('insurance-documents')
      .getPublicUrl(filePath);

    // Save document metadata to database
    const { data: docData, error: dbError } = await supabase
      .from('insurance_documents')
      .insert([
        {
          entity_type,
          entity_id,
          document_type,
          document_name: document_name.trim(),
          file_url: publicUrl,
          storage_path: filePath,
          file_name: fileName,
          file_type: file.type,
          file_size: file.size,
          coverage_amount: coverage_amount || null,
          expiry_date: expiry_date || null,
          notes: notes?.trim() || null,
          status: 'submitted'
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database save error:', dbError);
      // Try to delete the uploaded file since database insert failed
      await supabase.storage
        .from('insurance-documents')
        .remove([filePath]);
      return { data: null, error: `Failed to save document: ${dbError.message}` };
    }

    return { data: docData as InsuranceDocument, error: null };
  } catch (error) {
    console.error('Error in uploadInsuranceDocument:', error);
    return { data: null, error: 'Failed to upload insurance document' };
  }
}

// Get insurance documents for an entity
export async function getInsuranceDocuments(entity_type: 'organization' | 'user', entity_id: string): Promise<InsuranceDocumentResponse> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('insurance_documents')
      .select('*')
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching insurance documents:', error);
      return { data: null, error: error.message };
    }

    return { data: data as InsuranceDocument[], error: null };
  } catch (error) {
    console.error('Error in getInsuranceDocuments:', error);
    return { data: null, error: 'Failed to fetch insurance documents' };
  }
}

// Delete insurance document
export async function deleteInsuranceDocument(documentId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    // Get document details first
    const { data: docData, error: fetchError } = await supabase
      .from('insurance_documents')
      .select('storage_path')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      console.error('Error fetching document for deletion:', fetchError);
      return { error: fetchError.message };
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('insurance-documents')
      .remove([docData.storage_path]);

    if (storageError) {
      console.warn('Failed to delete from storage:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('insurance_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      return { error: dbError.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteInsuranceDocument:', error);
    return { error: 'Failed to delete insurance document' };
  }
}

// Update insurance document status (for admin review)
export async function updateInsuranceDocumentStatus(
  documentId: string, 
  status: 'approved' | 'rejected', 
  notes?: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('insurance_documents')
      .update({
        status,
        notes: notes?.trim() || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    if (error) {
      console.error('Error updating document status:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in updateInsuranceDocumentStatus:', error);
    return { error: 'Failed to update document status' };
  }
}

// Get insurance documents by status (for admin review)
export async function getInsuranceDocumentsByStatus(status: 'submitted' | 'approved' | 'rejected' | 'expired'): Promise<InsuranceDocumentResponse> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('insurance_documents')
      .select(`
        *,
        organizations (name, primary_contact_name),
        users (full_name, email)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents by status:', error);
      return { data: null, error: error.message };
    }

    return { data: data as any[], error: null };
  } catch (error) {
    console.error('Error in getInsuranceDocumentsByStatus:', error);
    return { data: null, error: 'Failed to fetch documents by status' };
  }
}

// Check if entity has valid insurance documents
export async function checkInsuranceStatus(entity_type: 'organization' | 'user', entity_id: string): Promise<{
  hasValidInsurance: boolean;
  hasApprovedDocuments: boolean;
  expiringDocuments: InsuranceDocument[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('insurance_documents')
      .select('*')
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id);

    if (error) {
      console.error('Error checking insurance status:', error);
      return { 
        hasValidInsurance: false, 
        hasApprovedDocuments: false, 
        expiringDocuments: [], 
        error: error.message 
      };
    }

    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const approvedDocuments = data.filter(doc => doc.status === 'approved');
    const validDocuments = approvedDocuments.filter(doc => 
      !doc.expiry_date || new Date(doc.expiry_date) > now
    );
    const expiringDocuments = approvedDocuments.filter(doc => 
      doc.expiry_date && 
      new Date(doc.expiry_date) > now && 
      new Date(doc.expiry_date) <= nextMonth
    );

    return {
      hasValidInsurance: validDocuments.length > 0,
      hasApprovedDocuments: approvedDocuments.length > 0,
      expiringDocuments: expiringDocuments as InsuranceDocument[],
      error: null
    };
  } catch (error) {
    console.error('Error in checkInsuranceStatus:', error);
    return { 
      hasValidInsurance: false, 
      hasApprovedDocuments: false, 
      expiringDocuments: [], 
      error: 'Failed to check insurance status' 
    };
  }
} 