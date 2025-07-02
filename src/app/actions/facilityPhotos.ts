'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';

export interface FacilityPhoto {
  id: string;
  facility_id: string;
  url: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export async function uploadFacilityPhoto(formData: FormData) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const photo = formData.get('photo') as File;
    const facilityId = formData.get('facilityId') as string;
    const description = formData.get('description') as string;

    if (!photo || !facilityId) {
      throw new Error('Photo and facilityId are required');
    }

    // Upload photo to storage
    const fileExt = photo.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `facilities/${facilityId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('facility-photos')
      .upload(filePath, photo);

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('facility-photos')
      .getPublicUrl(filePath);

    // Save to database
    const { data: photoData, error: dbError } = await supabase
      .from('facility_photos')
      .insert([
        {
          facility_id: facilityId,
          url: publicUrl,
          storage_path: filePath,
          file_name: fileName,
          file_type: photo.type,
          file_size: photo.size,
          description: description || null
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Error saving to database:', dbError);
      // Try to delete the uploaded file since database insert failed
      await supabase.storage
        .from('facility-photos')
        .remove([filePath]);
      throw dbError;
    }

    return photoData;
  } catch (error) {
    console.error('Error in uploadFacilityPhoto:', error);
    throw error;
  }
}

export async function getFacilityPhotos(facilityId: string): Promise<FacilityPhoto[]> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const { data, error } = await supabase
      .from('facility_photos')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching facility photos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getFacilityPhotos:', error);
    throw error;
  }
}

export async function deleteFacilityPhoto(photoId: string) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // First get the photo to get its storage path
    const { data: photo, error: fetchError } = await supabase
      .from('facility_photos')
      .select('storage_path')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      console.error('Error fetching photo for deletion:', fetchError);
      throw fetchError;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('facility-photos')
      .remove([photo.storage_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      throw storageError;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('facility_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      throw dbError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteFacilityPhoto:', error);
    throw error;
  }
}

export async function updateFacilityPhotoDescription(photoId: string, description: string) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const { data, error } = await supabase
      .from('facility_photos')
      .update({ description })
      .eq('id', photoId)
      .select()
      .single();

    if (error) {
      console.error('Error updating photo description:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateFacilityPhotoDescription:', error);
    throw error;
  }
} 