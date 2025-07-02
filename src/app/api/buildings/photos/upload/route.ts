import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    const buildingId = formData.get('buildingId') as string;

    if (!photo || !buildingId) {
      return NextResponse.json(
        { error: 'Photo and buildingId are required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to initialize storage client' },
        { status: 500 }
      );
    }

    // Upload photo to Supabase Storage
    const fileExt = photo.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `buildings/${buildingId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('building-photos')
      .upload(filePath, photo);

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded photo
    const { data: { publicUrl } } = supabase.storage
      .from('building-photos')
      .getPublicUrl(filePath);

    // Save photo metadata to database
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
        
      return NextResponse.json(
        { error: 'Failed to save photo metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json(photoData);
  } catch (error) {
    console.error('Error handling photo upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 