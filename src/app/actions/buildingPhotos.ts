'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';

export async function getBuildingPhotos(buildingId: string) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const { data: photos, error } = await supabase
      .from('building_photos')
      .select('*')
      .eq('building_id', buildingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching building photos:', error);
      throw error;
    }

    return photos || [];
  } catch (error) {
    console.error('Error in getBuildingPhotos:', error);
    throw error;
  }
}

export async function uploadBuildingPhoto(formData: FormData) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const photo = formData.get('photo') as File;
    const buildingId = formData.get('buildingId') as string;
    const description = formData.get('description') as string;

    if (!photo || !buildingId) {
      throw new Error('Photo and buildingId are required');
    }

    // Upload photo to storage
    const fileExt = photo.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `buildings/${buildingId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('building-photos')
      .upload(filePath, photo);

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('building-photos')
      .getPublicUrl(filePath);

    // Save to database
    const { data: photoData, error: dbError } = await supabase
      .from('building_photos')
      .insert([
        {
          building_id: buildingId,
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
        .from('building-photos')
        .remove([filePath]);
      throw dbError;
    }

    return photoData;
  } catch (error) {
    console.error('Error in uploadBuildingPhoto:', error);
    throw error;
  }
}

export async function deleteBuildingPhoto(photoId: string) {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Get photo data first to get storage path
    const { data: photo, error: fetchError } = await supabase
      .from('building_photos')
      .select('storage_path')
      .eq('id', photoId)
      .single();

    if (fetchError) {
      console.error('Error fetching photo data:', fetchError);
      throw fetchError;
    }

    // Delete from storage
    if (photo.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('building-photos')
        .remove([photo.storage_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('building_photos')
      .delete()
      .eq('id', photoId);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error in deleteBuildingPhoto:', error);
    throw error;
  }
} 