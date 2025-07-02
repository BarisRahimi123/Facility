'use server';

import { createClient } from '@/lib/supabase/server';
import { MaintenanceRequest } from '@/types/maintenance';
import { revalidatePath } from 'next/cache';

export async function createMaintenanceRequest(data: Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = await createClient();
    const { data: request, error } = await supabase
      .from('maintenance_requests')
      .insert([{
        ...data,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) throw error;

    // Revalidate the building page to show the new request
    revalidatePath(`/facility/${data.facility_id}/buildings/${data.building_id}`);

    return { success: true, data: request };
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    return { success: false, error: 'Failed to create maintenance request' };
  }
}

export async function updateMaintenanceRequest(
  requestId: string,
  data: Partial<Omit<MaintenanceRequest, 'id' | 'created_at' | 'updated_at'>>
) {
  try {
    const supabase = await createClient();
    const { data: request, error } = await supabase
      .from('maintenance_requests')
      .update(data)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    // Revalidate the building page to show the updated request
    if (request.building_id && request.facility_id) {
      revalidatePath(`/facility/${request.facility_id}/buildings/${request.building_id}`);
    }

    return { success: true, data: request };
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    return { success: false, error: 'Failed to update maintenance request' };
  }
}

export async function getMaintenanceRequests(buildingId: string) {
  try {
    const supabase = await createClient();
    const { data: requests, error } = await supabase
      .from('maintenance_requests')
      .select('*')
      .eq('building_id', buildingId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: requests };
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    return { success: false, error: 'Failed to fetch maintenance requests' };
  }
} 