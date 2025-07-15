import { createClient } from '@supabase/supabase-js';

function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

const supabase = getStorageClient();

/**
 * Generates a unique file path for storing a plan file
 */
export function generateFilePath(fileName: string, folderId: string): string {
  const timestamp = Date.now();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${folderId}/${timestamp}_${cleanFileName}`;
}

/**
 * Uploads a plan file to Supabase storage
 */
export async function uploadPlanFile(file: File, filePath: string): Promise<void> {
  console.log('Starting file upload to storage:', { filePath, fileSize: file.size, fileType: file.type });
  
  try {
    // Check if file size is within limits (50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit of 50MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/vnd.dxf', 'application/acad'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.dwg')) {
      throw new Error(`Invalid file type: ${file.type}. Allowed types: PDF, DWG, DXF`);
    }

    console.log('Uploading file to Supabase storage...');
    const { error } = await supabase.storage
      .from('plans')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      if (error.message.includes('duplicate')) {
        throw new Error('A file with this name already exists in this folder');
      }
      throw new Error(`Failed to upload plan file: ${error.message}`);
    }

    console.log('File upload successful:', filePath);
  } catch (error) {
    console.error('Upload error:', error);
    throw error instanceof Error ? error : new Error('Unknown error during file upload');
  }
}

/**
 * Uploads a thumbnail image for a plan
 */
export async function uploadThumbnail(file: File, thumbnailPath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('thumbnails')
    .upload(thumbnailPath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Thumbnail upload error:', error);
    throw new Error(`Failed to upload thumbnail: ${error.message}`);
  }
}

/**
 * Gets the public URL for a plan file
 */
export function getPlanFileUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('plans')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Gets the public URL for a thumbnail
 */
export function getThumbnailUrl(thumbnailPath: string): string {
  const { data } = supabase.storage
    .from('thumbnails')
    .getPublicUrl(thumbnailPath);

  return data.publicUrl;
}

/**
 * Deletes a plan file from storage
 */
export async function deletePlanFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('plans')
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete plan file: ${error.message}`);
  }
}

/**
 * Deletes a thumbnail from storage
 */
export async function deleteThumbnail(thumbnailPath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('thumbnails')
    .remove([thumbnailPath]);

  if (error) {
    console.error('Delete thumbnail error:', error);
    throw new Error(`Failed to delete thumbnail: ${error.message}`);
  }
}  