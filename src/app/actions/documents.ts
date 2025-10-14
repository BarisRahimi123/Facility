'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Create service role client for development
function getServiceRoleSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
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

export async function getDocuments(entityId: string, entityType: 'building' | 'facility' = 'building') {
  const serviceRoleClient = getServiceRoleSupabase();

  const columnName = entityType === 'facility' ? 'facility_id' : 'building_id';
  
  const { data, error } = await serviceRoleClient
    .from('documents')
    .select('*')
    .eq(columnName, entityId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  return data || [];
}

export async function uploadDocument(formData: FormData) {
  try {
    const serviceRoleClient = getServiceRoleSupabase();
    
    const buildingId = formData.get('building_id') as string || formData.get('buildingId') as string;
    const facilityId = formData.get('facility_id') as string || formData.get('facilityId') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;
    const version = formData.get('version') as string;
    const folderId = formData.get('folder_id') as string;
    const file = formData.get('file') as File;

    console.log('Upload folder_id:', folderId, 'Type:', typeof folderId);

    const entityId = buildingId || facilityId;
    const entityType = buildingId ? 'building' : 'facility';

    // Validate folder_id if provided
    if (folderId && folderId.trim() !== '') {
      try {
        const { data: folderExists, error: folderError } = await serviceRoleClient
          .from('document_folders')
          .select('id')
          .eq('id', folderId)
          .single();
        
        if (folderError || !folderExists) {
          console.error('Invalid folder_id:', folderId, folderError);
          return { error: 'Invalid folder selected' };
        }
      } catch (folderCheckError) {
        console.error('Error checking folder:', folderCheckError);
        // Continue without folder validation
      }
    }

    console.log('Upload request:', {
      entityType,
      entityId,
      name,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    });

    if (!entityId || !name || !file) {
      console.error('Missing required fields:', { entityId, name, file: !!file });
      return { error: 'Missing required fields' };
    }

  // Validate file type
  if (!file.type) {
    console.error('File type is empty, attempting to determine from extension');
  }

  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const folderName = entityType === 'building' ? `buildings/${entityId}` : `facilities/${entityId}`;
  const fileName = `${folderName}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  console.log('Uploading to path:', fileName);

  // Upload file to Supabase storage
  const { data: uploadData, error: uploadError } = await serviceRoleClient.storage
    .from('documents')
    .upload(fileName, file);

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    console.error('Error details:', {
      message: uploadError.message,
      statusCode: (uploadError as any).statusCode,
      error: uploadError
    });
    return { error: `Failed to upload file: ${uploadError.message}` };
  }

  // Get public URL for the file
  const { data: { publicUrl } } = serviceRoleClient.storage
    .from('documents')
    .getPublicUrl(fileName);

  // Save document metadata to database
  const documentData: any = {
    name,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type || 'application/octet-stream',
    file_url: publicUrl,
    description: description || null,
    category: category || 'General',
    version: version || null,
    folder_id: (folderId && folderId.trim() !== '') ? folderId : null,
    tags: tags ? tags.split(',').map(t => t.trim()) : [],
    uploaded_by: null // Using null for mock user
  };

  // Add the appropriate ID field
  if (entityType === 'building') {
    documentData.building_id = entityId;
  } else {
    documentData.facility_id = entityId;
  }

  console.log('Saving document metadata:', documentData);

  const { data, error } = await serviceRoleClient
    .from('documents')
    .insert(documentData)
    .select()
    .single();

  if (error) {
    console.error('Database save error:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    // Clean up uploaded file
    await serviceRoleClient.storage.from('documents').remove([fileName]);
    return { error: `Failed to save document: ${error.message}` };
  }

  console.log('Document saved successfully:', data);

  revalidatePath('/');
  return { data };
  } catch (error) {
    console.error('Upload document exception:', error);
    return { error: error instanceof Error ? error.message : 'Failed to upload document. Please try again.' };
  }
}

export async function updateDocument(formData: FormData) {
  const serviceRoleClient = getServiceRoleSupabase();
  
  const documentId = formData.get('documentId') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const tags = formData.get('tags') as string;

  if (!documentId || !name) {
    return { error: 'Missing required fields' };
  }

  const { data, error } = await serviceRoleClient
    .from('documents')
    .update({
      name,
      description,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating document:', error);
    return { error: 'Failed to update document' };
  }

  revalidatePath('/');
  return { data };
}

export async function deleteDocument(documentId: string, fileUrl: string) {
  const serviceRoleClient = getServiceRoleSupabase();

  // Extract file path from URL
  const urlParts = fileUrl.split('/storage/v1/object/public/documents/');
  const filePath = urlParts[1];

  // Delete file from storage
  if (filePath) {
    const { error: storageError } = await serviceRoleClient.storage
      .from('documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }
  }

  // Delete document metadata from database
  const { error } = await serviceRoleClient
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    console.error('Error deleting document:', error);
    return { error: 'Failed to delete document' };
  }

  revalidatePath('/');
  return { success: true };
}

export async function createDocumentsBucket() {
  const serviceRoleClient = getServiceRoleSupabase();

  // Check if bucket exists
  const { data: buckets } = await serviceRoleClient.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === 'documents');

  if (!bucketExists) {
    // Create the bucket
    const { error } = await serviceRoleClient.storage.createBucket('documents', {
      public: true
    });

    if (error) {
      console.error('Error creating documents bucket:', error);
      return { error: 'Failed to create storage bucket' };
    }
  }

  return { success: true };
}  