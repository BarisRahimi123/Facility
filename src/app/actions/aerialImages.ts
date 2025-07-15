'use server';

import { createClient } from '@supabase/supabase-js';

// Use service role client for server actions
function getServiceRoleClient() {
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

const serviceRoleClient = getServiceRoleClient();

export interface AerialImage {
  id: string;
  facility_id: string;
  title: string;
  description?: string;
  image_type: 'drone_photo' | 'mosaic' | 'map' | 'thermal' | 'other';
  image_url: string;
  capture_date: string;
  resolution?: string;
  coverage_area?: string;
  altitude?: number;
  camera_specs?: string;
  processing_software?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

export async function getAerialImages(facilityId: string): Promise<AerialImage[]> {
  try {
    console.log('Fetching aerial images for facility:', facilityId);

    const { data, error } = await serviceRoleClient
      .from('aerial_images')
      .select('*')
      .eq('facility_id', facilityId)
      .order('capture_date', { ascending: false });

    if (error) {
      console.error('Error fetching aerial images:', error);
      return [];
    }

    console.log(`Found ${data?.length || 0} aerial images for facility ${facilityId}`);
    return data || [];
  } catch (error) {
    console.error('Unexpected error in getAerialImages:', error);
    return [];
  }
}

export async function uploadAerialImage(formData: FormData): Promise<void> {
  try {
    const facilityId = formData.get('facilityId')?.toString();
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const imageType = formData.get('imageType')?.toString() as AerialImage['image_type'];
    const captureDate = formData.get('captureDate')?.toString();
    const resolution = formData.get('resolution')?.toString();
    const coverageArea = formData.get('coverageArea')?.toString();
    const altitude = formData.get('altitude')?.toString();
    const cameraSpecs = formData.get('cameraSpecs')?.toString();
    const processingSoftware = formData.get('processingSoftware')?.toString();
    const file = formData.get('file') as File;

    console.log('Raw form data received:', {
      facilityId,
      title,
      description,
      imageType,
      captureDate,
      resolution,
      coverageArea,
      altitude,
      cameraSpecs,
      processingSoftware,
      file: file ? {
        name: file.name,
        type: file.type,
        size: file.size
      } : null
    });

    if (!facilityId || !title || !imageType || !captureDate || !file) {
      console.error('Missing required fields:', {
        facilityId: !!facilityId,
        title: !!title,
        imageType: !!imageType,
        captureDate: !!captureDate,
        file: !!file
      });
      throw new Error('Missing required fields: facilityId, title, imageType, captureDate, and file are required');
    }

    console.log('Uploading aerial image:', {
      facilityId,
      title,
      imageType,
      fileName: file.name,
      fileSize: file.size
    });

    // TODO: Upload file to Supabase Storage
    // For now, we'll use a placeholder URL
    const imageUrl = `https://placeholder-bucket.supabase.co/storage/v1/object/public/aerial-images/${file.name}`;

    const aerialImageData: Partial<AerialImage> = {
      facility_id: facilityId,
      title: title,
      description: description || undefined,
      image_type: imageType,
      image_url: imageUrl,
      capture_date: captureDate,
      resolution: resolution || undefined,
      coverage_area: coverageArea || undefined,
      altitude: altitude ? parseInt(altitude) : undefined,
      camera_specs: cameraSpecs || undefined,
      processing_software: processingSoftware || undefined,
      file_size: file.size
    };

    console.log('Prepared data for database insertion:', aerialImageData);

    // First check if the table exists
    const { data: tableExists } = await serviceRoleClient
      .from('aerial_images')
      .select('id')
      .limit(1);

    console.log('Table check result:', { tableExists: !!tableExists });

    const { data, error } = await serviceRoleClient
      .from('aerial_images')
      .insert([aerialImageData])
      .select()
      .single();

    console.log('Database insert result:', { data, error });

    if (error) {
      console.error('Database error creating aerial image:', error);
      // Better error handling for Supabase errors
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error('Failed to save aerial image: ' + errorMessage);
    }

    console.log('Aerial image uploaded successfully:', data);
  } catch (error) {
    console.error('Error in uploadAerialImage:', error);
    throw error;
  }
}

export async function updateAerialImage(imageId: string, formData: FormData): Promise<void> {
  try {
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const imageType = formData.get('imageType')?.toString() as AerialImage['image_type'];
    const captureDate = formData.get('captureDate')?.toString();
    const resolution = formData.get('resolution')?.toString();
    const coverageArea = formData.get('coverageArea')?.toString();
    const altitude = formData.get('altitude')?.toString();
    const cameraSpecs = formData.get('cameraSpecs')?.toString();
    const processingSoftware = formData.get('processingSoftware')?.toString();

    if (!title || !imageType || !captureDate) {
      throw new Error('Missing required fields: title, imageType, and captureDate are required');
    }

    console.log('Updating aerial image:', imageId);

    const updateData: Partial<AerialImage> = {
      title: title,
      description: description || undefined,
      image_type: imageType,
      capture_date: captureDate,
      resolution: resolution || undefined,
      coverage_area: coverageArea || undefined,
      altitude: altitude ? parseInt(altitude) : undefined,
      camera_specs: cameraSpecs || undefined,
      processing_software: processingSoftware || undefined,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await serviceRoleClient
      .from('aerial_images')
      .update(updateData)
      .eq('id', imageId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating aerial image:', error);
      // Better error handling for Supabase errors
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error('Failed to update aerial image: ' + errorMessage);
    }

    console.log('Aerial image updated successfully:', data);
  } catch (error) {
    console.error('Error in updateAerialImage:', error);
    throw error;
  }
}

export async function deleteAerialImage(imageId: string): Promise<void> {
  try {
    console.log('Deleting aerial image:', imageId);

    // TODO: Delete file from Supabase Storage as well
    
    const { error } = await serviceRoleClient
      .from('aerial_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Database error deleting aerial image:', error);
      // Better error handling for Supabase errors
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error('Failed to delete aerial image: ' + errorMessage);
    }

    console.log('Aerial image deleted successfully');
  } catch (error) {
    console.error('Error in deleteAerialImage:', error);
    throw error;
  }
}

export async function getAerialImagesByType(facilityId: string, imageType: AerialImage['image_type']): Promise<AerialImage[]> {
  try {
    console.log('Fetching aerial images by type:', { facilityId, imageType });

    const { data, error } = await serviceRoleClient
      .from('aerial_images')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('image_type', imageType)
      .order('capture_date', { ascending: false });

    if (error) {
      console.error('Error fetching aerial images by type:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error in getAerialImagesByType:', error);
    return [];
  }
}  