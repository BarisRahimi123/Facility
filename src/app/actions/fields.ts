'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { Field, Reservation, CreateFieldRequest, CreateReservationRequest, FieldSearchFilters } from '@/types/field';
import { sendReservationSubmittedNotifications, sendReservationApprovedNotifications } from '@/lib/notifications';
import { getFacilityById } from './facilities';

// Field Actions
export async function getFields(facilityId: string): Promise<Field[]> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const { data: fields, error } = await supabase
      .from('fields')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fields:', error);
      
      // Check if this is a table doesn't exist error
      if (error.code === '42P01' && error.message.includes('relation "public.fields" does not exist')) {
        // Return empty array instead of throwing - let the client handle it
        return [];
      }
      
      throw error;
    }

    return fields || [];
  } catch (error) {
    console.error('Error in getFields:', error);
    
    // If it's a table doesn't exist error that somehow got through, return empty array
    if (error instanceof Error && error.message.includes('relation "public.fields" does not exist')) {
      return [];
    }
    
    throw error;
  }
}

export async function getFieldById(fieldId: string): Promise<Field | null> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const { data: field, error } = await supabase
      .from('fields')
      .select('*')
      .eq('id', fieldId)
      .single();

    if (error) {
      console.error('Error fetching field:', error);
      throw error;
    }

    return field;
  } catch (error) {
    console.error('Error in getFieldById:', error);
    throw error;
  }
}

export async function createField(fieldData: CreateFieldRequest): Promise<Field> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Prepare field data for database insertion
    const {
      field_images,
      aerial_image,
      aerial_image_description,
      ...dbFieldData
    } = fieldData;

    // Include all address fields and coordinates
    const fieldForDb = {
      ...dbFieldData,
      // Include all address and location data
      street_address: fieldData.street_address || null,
      zip_code: fieldData.zip_code || null,
      city: fieldData.city || null,
      state: fieldData.state || null,
      full_address: fieldData.full_address || null,
      latitude: fieldData.latitude || null,
      longitude: fieldData.longitude || null,
      virtual_tour_url: fieldData.virtual_tour_url || null,
      virtual_tour_description: fieldData.virtual_tour_description || null,
      status: 'available',
      maintenance_status: 'excellent',
    };

    console.log('Creating field with data:', fieldForDb);

    // Create the field first
    const { data: field, error } = await supabase
      .from('fields')
      .insert(fieldForDb)
      .select()
      .single();

    if (error) {
      console.error('Error creating field:', error);
      throw error;
    }

    console.log('Field created successfully:', field);

    // Handle file uploads after field creation
    const imageUrls: string[] = [];
    let aerialImageUrl: string | null = null;

    // Upload field images if provided
    if (field_images && field_images.length > 0) {
      try {
        for (const image of field_images) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `fields/${field.id}/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('field-images')
            .upload(filePath, image);

          if (uploadError) {
            console.error('Error uploading field image:', uploadError);
            continue; // Skip this image but continue with others
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('field-images')
            .getPublicUrl(filePath);

          imageUrls.push(publicUrl);
        }
      } catch (error) {
        console.error('Error uploading field images:', error);
        // Don't throw - field creation succeeded, just image upload failed
      }
    }

    // Upload aerial image if provided
    if (aerial_image) {
      try {
        const fileExt = aerial_image.name.split('.').pop();
        const fileName = `aerial-${Date.now()}.${fileExt}`;
        const filePath = `aerial/${field.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('aerial-images')
          .upload(filePath, aerial_image);

        if (!uploadError) {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('aerial-images')
            .getPublicUrl(filePath);

          aerialImageUrl = publicUrl;
        } else {
          console.error('Error uploading aerial image:', uploadError);
        }
      } catch (error) {
        console.error('Error uploading aerial image:', error);
        // Don't throw - field creation succeeded, just aerial image upload failed
      }
    }

    // Update field with uploaded image URLs
    if (imageUrls.length > 0) {
      const updateData: any = {};
      
      if (imageUrls.length > 0) {
        updateData.image_url = imageUrls[0]; // Use first image as primary
        updateData.gallery_images = imageUrls;
      }
      
      // Note: aerial_image_url will be added after database schema update

      const { error: updateError } = await supabase
        .from('fields')
        .update(updateData)
        .eq('id', field.id);

      if (updateError) {
        console.error('Error updating field with image URLs:', updateError);
        // Don't throw - field was created successfully
      }

      // Return updated field data
      return {
        ...field,
        ...updateData,
        aerial_image_url: aerialImageUrl,
        aerial_image_description: fieldData.aerial_image_description,
      };
    }

    // Return field with aerial image data
    return {
      ...field,
      aerial_image_url: aerialImageUrl,
      aerial_image_description: fieldData.aerial_image_description,
    };
  } catch (error) {
    console.error('Error in createField:', error);
    throw error;
  }
}

export async function updateField(fieldId: string, fieldData: Partial<CreateFieldRequest>): Promise<Field> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Extract image-related data before updating the field
    const newImages = fieldData.field_images as File[] || [];
    const existingImageUrls = fieldData.existing_image_urls as string[] || [];
    const virtualTourUrl = fieldData.virtual_tour_url;
    const virtualTourDescription = fieldData.virtual_tour_description;
    
    // Remove image-related fields from the main update data but keep address fields
    const {
      field_images,
      existing_image_urls,
      ...updateData
    } = fieldData;

    // Ensure address fields are included in the update data
    const finalUpdateData = {
      ...updateData,
      virtual_tour_url: virtualTourUrl,
      virtual_tour_description: virtualTourDescription,
    };

    // Update the field with non-image data first
    const { data: field, error } = await supabase
      .from('fields')
      .update(finalUpdateData)
      .eq('id', fieldId)
      .select()
      .single();

    if (error) {
      console.error('Error updating field:', error);
      throw error;
    }

    // Handle image uploads if there are new images
    const uploadedImageUrls: string[] = [];
    
    if (newImages.length > 0) {
      console.log(`Uploading ${newImages.length} new images for field ${fieldId}`);
      
      for (const imageFile of newImages) {
        try {
          // Upload image to Supabase Storage
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `fields/${fieldId}/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('field-images')
            .upload(filePath, imageFile, {
              contentType: imageFile.type
            });

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue; // Skip this image and continue with others
          }

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('field-images')
            .getPublicUrl(filePath);

          if (publicUrlData?.publicUrl) {
            uploadedImageUrls.push(publicUrlData.publicUrl);
          }
        } catch (imageError) {
          console.error('Error processing image:', imageError);
          // Continue with other images
        }
      }
    }

    // Combine existing and new image URLs
    const allImageUrls = [...existingImageUrls, ...uploadedImageUrls];

    // Update field with image URLs and virtual tour data
    if (allImageUrls.length > 0 || virtualTourUrl || virtualTourDescription) {
      const imageUpdateData: any = {};
      
      if (allImageUrls.length > 0) {
        imageUpdateData.gallery_images = allImageUrls;
        // Set first image as primary if no image_url exists
        if (!field.image_url && allImageUrls.length > 0) {
          imageUpdateData.image_url = allImageUrls[0];
        }
      }
      
      if (virtualTourUrl !== undefined) {
        imageUpdateData.virtual_tour_url = virtualTourUrl;
      }
      
      if (virtualTourDescription !== undefined) {
        imageUpdateData.virtual_tour_description = virtualTourDescription;
      }

      const { error: imageUpdateError } = await supabase
        .from('fields')
        .update(imageUpdateData)
        .eq('id', fieldId);

      if (imageUpdateError) {
        console.error('Error updating field with images:', imageUpdateError);
        // Don't throw - field was updated successfully, just log the image error
      }
    }

    // Return the updated field with all data
    const { data: updatedField, error: fetchError } = await supabase
      .from('fields')
      .select('*')
      .eq('id', fieldId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated field:', fetchError);
      return field; // Return the original field data if fetch fails
    }

    return updatedField;
  } catch (error) {
    console.error('Error in updateField:', error);
    throw error;
  }
}

export async function deleteField(fieldId: string): Promise<void> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const { error } = await supabase
      .from('fields')
      .delete()
      .eq('id', fieldId);

    if (error) {
      console.error('Error deleting field:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteField:', error);
    throw error;
  }
}

export async function searchFields(filters: FieldSearchFilters): Promise<Field[]> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const query = supabase.from('fields').select('*');

    // Apply filters
    if (filters.facility_id) {
      query = query.eq('facility_id', filters.facility_id);
    }

    if (filters.type && filters.type.length > 0) {
      query = query.in('type', filters.type);
    }

    if (filters.surface_type && filters.surface_type.length > 0) {
      query = query.in('surface_type', filters.surface_type);
    }

    if (filters.ada_compliant !== undefined) {
      query = query.eq('ada_compliant', filters.ada_compliant);
    }

    if (filters.has_lighting !== undefined) {
      query = query.eq('has_lighting', filters.has_lighting);
    }

    if (filters.has_parking !== undefined) {
      query = query.eq('has_parking', filters.has_parking);
    }

    if (filters.min_capacity) {
      query = query.gte('capacity', filters.min_capacity);
    }

    if (filters.max_hourly_rate) {
      query = query.lte('hourly_rate', filters.max_hourly_rate);
    }

    if (filters.max_daily_rate) {
      query = query.lte('daily_rate', filters.max_daily_rate);
    }

    // Only show available fields by default
    query = query.eq('status', 'available');

    const { data: fields, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching fields:', error);
      throw error;
    }

    return fields || [];
  } catch (error) {
    console.error('Error in searchFields:', error);
    throw error;
  }
}

// Reservation Actions
export async function getReservations(facilityId?: string): Promise<Reservation[]> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    let query = supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (facilityId) {
      query = query.eq('facility_id', facilityId);
    }

    const { data: reservations, error } = await query;

    if (error) {
      console.error('Error fetching reservations:', error);
      throw error;
    }

    return reservations || [];
  } catch (error) {
    console.error('Error in getReservations:', error);
    throw error;
  }
}

export async function getFieldReservations(fieldId: string): Promise<Reservation[]> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('field_id', fieldId)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching field reservations:', error);
      throw error;
    }

    return reservations || [];
  } catch (error) {
    console.error('Error in getFieldReservations:', error);
    throw error;
  }
}

export async function createReservation(reservationData: CreateReservationRequest): Promise<Reservation> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Get field to calculate pricing
    const field = await getFieldById(reservationData.field_id);
    if (!field) {
      throw new Error('Field not found');
    }

    // Get facility name for notifications
    const facility = await getFacilityById(field.facility_id);
    const facilityName = facility?.name || 'Unknown Facility';

    // Calculate total amount based on booking type and duration
    const startTime = new Date(reservationData.start_time);
    const endTime = new Date(reservationData.end_time);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    let totalAmount = 0;
    if (reservationData.booking_type === 'hourly') {
      totalAmount = durationHours * field.hourly_rate;
    } else if (reservationData.booking_type === 'daily') {
      const durationDays = Math.ceil(durationHours / 24);
      totalAmount = durationDays * field.daily_rate;
    }

    // Calculate tax and deposit
    const taxRate = 0.085; // 8.5%
    const taxAmount = totalAmount * taxRate;
    const depositRate = 0.25; // 25%
    const depositAmount = totalAmount * depositRate;

    const reservationWithAmount = {
      ...reservationData,
      facility_id: field.facility_id,
      total_amount: totalAmount + taxAmount,
      hourly_rate: field.hourly_rate,
      daily_rate: field.daily_rate,
      tax_amount: taxAmount,
      deposit_amount: depositAmount,
      approval_required: field.requires_approval || false,
      status: (field.instant_booking && !field.requires_approval) ? 'confirmed' : 'pending',
      payment_status: 'pending',
      liability_waiver_signed: true, // Assuming checkbox was checked in form
      liability_waiver_signed_at: new Date().toISOString(),
    };

    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert(reservationWithAmount)
      .select()
      .single();

    if (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }

    // Send notifications asynchronously
    try {
      await sendReservationSubmittedNotifications({
        reservation,
        field,
        facilityName,
      });
    } catch (notificationError) {
      console.error('Failed to send reservation notifications:', notificationError);
      // Don't fail the reservation creation if notifications fail
    }

    return reservation;
  } catch (error) {
    console.error('Error in createReservation:', error);
    throw error;
  }
}

export async function updateReservation(reservationId: string, reservationData: Partial<Reservation>): Promise<Reservation> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const { data: reservation, error } = await supabase
      .from('reservations')
      .update(reservationData)
      .eq('id', reservationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }

    return reservation;
  } catch (error) {
    console.error('Error in updateReservation:', error);
    throw error;
  }
}

export async function cancelReservation(reservationId: string): Promise<void> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);

    if (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in cancelReservation:', error);
    throw error;
  }
}

export async function approveReservation(reservationId: string, approvedBy: string): Promise<Reservation> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // First get the current reservation
    const { data: currentReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !currentReservation) {
      throw new Error('Reservation not found');
    }

    // Update reservation status
    const { data: reservation, error } = await supabase
      .from('reservations')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .select()
      .single();

    if (error) {
      console.error('Error approving reservation:', error);
      throw error;
    }

    // Get field and facility details for notifications
    const field = await getFieldById(reservation.field_id);
    const facility = await getFacilityById(reservation.facility_id);
    
    if (field && facility) {
      // Send approval notifications asynchronously
      try {
        await sendReservationApprovedNotifications({
          reservation,
          field,
          facilityName: facility.name,
        });
      } catch (notificationError) {
        console.error('Failed to send approval notifications:', notificationError);
        // Don't fail the approval if notifications fail
      }
    }

    return reservation;
  } catch (error) {
    console.error('Error in approveReservation:', error);
    throw error;
  }
}

export async function rejectReservation(reservationId: string, rejectedBy: string, reason?: string): Promise<Reservation> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // First get the current reservation
    const { data: currentReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !currentReservation) {
      throw new Error('Reservation not found');
    }

    // Update reservation status
    const { data: reservation, error } = await supabase
      .from('reservations')
      .update({
        status: 'rejected',
        approved_by: rejectedBy,
        approved_at: new Date().toISOString(),
        special_requests: reason ? `REJECTION REASON: ${reason}${currentReservation.special_requests ? '\n\nORIGINAL REQUESTS: ' + currentReservation.special_requests : ''}` : currentReservation.special_requests,
      })
      .eq('id', reservationId)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting reservation:', error);
      throw error;
    }

    // TODO: Add rejection notification emails/SMS

    return reservation;
  } catch (error) {
    console.error('Error in rejectReservation:', error);
    throw error;
  }
}

// Availability checking
export async function checkFieldAvailability(
  fieldId: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    // Check for overlapping reservations
    const { data: overlappingReservations, error } = await supabase
      .from('reservations')
      .select('id')
      .eq('field_id', fieldId)
      .not('status', 'in', '(cancelled,rejected)')
      .or(`and(start_time.lte.${startTime},end_time.gt.${startTime}),and(start_time.lt.${endTime},end_time.gte.${endTime}),and(start_time.gte.${startTime},end_time.lte.${endTime})`);

    if (error) {
      console.error('Error checking availability:', error);
      throw error;
    }

    return !overlappingReservations || overlappingReservations.length === 0;
  } catch (error) {
    console.error('Error in checkFieldAvailability:', error);
    throw error;
  }
}

// Upload field image
export async function uploadFieldImage(formData: FormData): Promise<string> {
  try {
    console.log('uploadFieldImage: Starting upload process...');
    
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    const file = formData.get('image') as File;
    const fieldId = formData.get('fieldId') as string;

    console.log('uploadFieldImage: Received file:', file?.name, 'for field:', fieldId);

    if (!file || !fieldId) {
      throw new Error('Image and field ID are required');
    }

    // Upload image to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `fields/${fieldId}/${fileName}`;

    console.log('uploadFieldImage: Uploading to path:', filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('field-images')
      .upload(filePath, file, {
        contentType: file.type
      });

    if (uploadError) {
      console.error('uploadFieldImage: Upload error:', uploadError);
      throw uploadError;
    }

    console.log('uploadFieldImage: Upload successful:', uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('field-images')
      .getPublicUrl(filePath);

    console.log('uploadFieldImage: Generated public URL:', publicUrl);

    // Update field with image URL - but don't overwrite existing gallery_images
    // Instead, add this image to the gallery
    const { data: currentField, error: fetchError } = await supabase
      .from('fields')
      .select('gallery_images')
      .eq('id', fieldId)
      .single();

    if (fetchError) {
      console.error('uploadFieldImage: Error fetching current field:', fetchError);
      // Continue anyway, just update with the new image
    }

    const currentGallery = currentField?.gallery_images || [];
    const updatedGallery = Array.isArray(currentGallery) ? [...currentGallery, publicUrl] : [publicUrl];

    const { error: updateError } = await supabase
      .from('fields')
      .update({
        image_url: currentGallery.length === 0 ? publicUrl : undefined, // Only set as primary if no existing images
        gallery_images: updatedGallery,
        image_description: formData.get('imageDescription') as string || null,
      })
      .eq('id', fieldId);

    if (updateError) {
      console.error('uploadFieldImage: Error updating field with image URL:', updateError);
      throw updateError;
    }

    console.log('uploadFieldImage: Field updated successfully');
    return publicUrl;
  } catch (error) {
    console.error('uploadFieldImage: Error in uploadFieldImage:', error);
    throw error;
  }
}

// Check if fields tables are set up
export async function checkFieldsTableExists(): Promise<boolean> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      return false;
    }

    const { error } = await supabase
      .from('fields')
      .select('id')
      .limit(1);

    // If no error, table exists
    if (!error) {
      return true;
    }

    // If error is table doesn't exist, return false
    if (error.code === '42P01' && error.message.includes('relation "public.fields" does not exist')) {
      return false;
    }

    // For other errors, assume table exists but there's a different issue
    return true;
  } catch (error) {
    console.error('Error checking fields table:', error);
    return false;
  }
}

// Get all fields across all facilities for map display
export async function getAllFieldsForMap(): Promise<Field[]> {
  try {
    const supabase = getServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    console.log('getAllFieldsForMap: Fetching real fields from database...');

    // First try a simple query to get all fields
    const { data: fields, error } = await supabase
      .from('fields')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all fields for map:', error);
      
      // Check if this is a table doesn't exist error
      if (error.code === '42P01' && error.message.includes('relation "public.fields" does not exist')) {
        console.log('Fields table does not exist, returning empty array');
        return [];
      }
      
      throw error;
    }

    console.log(`getAllFieldsForMap: Found ${fields?.length || 0} fields`);
    if (fields && fields.length > 0) {
      console.log('getAllFieldsForMap: Field names:', fields.map(f => f.name));
      console.log('getAllFieldsForMap: Fields with images:', fields.filter(f => f.image_url).map(f => ({ name: f.name, image_url: f.image_url })));
      // Debug gallery images
      const fieldsWithGallery = fields.filter(f => f.gallery_images);
      if (fieldsWithGallery.length > 0) {
        console.log('getAllFieldsForMap: Fields with gallery_images:', fieldsWithGallery.map(f => ({ 
          name: f.name, 
          gallery_count: Array.isArray(f.gallery_images) ? f.gallery_images.length : 'not array'
        })));
      }
    }
    
    return fields || [];
  } catch (error) {
    console.error('Error in getAllFieldsForMap:', error);
    
    // If it's a table doesn't exist error that somehow got through, return empty array
    if (error instanceof Error && error.message.includes('relation "public.fields" does not exist')) {
      return [];
    }
    
    return []; // Return empty array instead of throwing to prevent map from breaking
  }
}        