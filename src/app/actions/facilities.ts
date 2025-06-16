'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FacilityService } from '@/lib/services/facility.service';
import type { FacilityFormData, FacilityType, FacilityStatus, Facility } from '@/types/facility';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getMockFacilities, addMockFacility, getMockFacilityById } from '@/lib/mock-data';

// Create a direct Supabase client for server-side operations
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// System user UUID for when no authenticated user is available
const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000000';

export async function createFacility(formData: FormData): Promise<void> {
  try {
    // Log the form data for debugging
    console.log('Creating facility with form data:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    // Get and validate form data with better error handling
    const name = formData.get('name');
    const address = formData.get('address');
    const city = formData.get('city');
    const state = formData.get('state');
    const zip = formData.get('zip');
    const type = formData.get('type') as FacilityType;
    const status = formData.get('status') as FacilityStatus;
    const squareFootage = formData.get('squareFootage') ? Number(formData.get('squareFootage')) : null;
    const yearBuilt = formData.get('yearBuilt') ? formData.get('yearBuilt')?.toString() : null;
    const facilityConditionIndex = formData.get('facilityConditionIndex') ? Number(formData.get('facilityConditionIndex')) : null;
    const notes = formData.get('notes');

    if (!name || !address || !city || !state || !zip || !type || !status || !squareFootage || !facilityConditionIndex) {
      throw new Error('Missing required facility information');
    }

    // Create a minimal facility data object with only the fields we know exist in the database
    const facilityData: any = {
      name: name.toString(),
      address: `${address}, ${city}, ${state} ${zip}`,
      facility_type: type.toString(),
      status: status?.toString() || 'active',
      square_footage: squareFootage ? parseFloat(squareFootage.toString()) : 0,
      year_built: yearBuilt ? parseInt(yearBuilt.toString()) : null,
      facility_condition_index: facilityConditionIndex ? parseFloat(facilityConditionIndex.toString()) : 0,
      description: notes?.toString() || '',
      rooms: 0,
      active_issues: 0,
      occupancy_rate: 0,
      created_by: null, // Start with null
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Facility data object:', facilityData);

    // Try to get the current user, but continue if it fails
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        facilityData.created_by = user.id;
        console.log('Setting created_by to user ID:', user.id);
      } else {
        console.log('No authenticated user found, using null for created_by');
      }
    } catch (authError) {
      console.error('Error getting authenticated user:', authError);
      console.log('Proceeding with null created_by');
    }

    try {
      // First try using the service
      console.log('Attempting to create facility using FacilityService...');
      await FacilityService.createFacility(facilityData as any);
      console.log('Facility created successfully in database!');
    } catch (serviceError) {
      console.error('Service error:', serviceError);
      
      // Only use mock data as absolute last resort
      console.log('Database operation failed, using mock data as fallback');
      
      // Create mock facility
      const newFacility: Facility = {
        id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.toString(),
        facility_type: type,
        address: `${address}, ${city}, ${state} ${zip}`,
        description: notes?.toString() || '',
        status: status,
        square_footage: squareFootage,
        facility_condition_index: facilityConditionIndex,
        rooms: 0,
        active_issues: 0,
        occupancy_rate: 0,
        created_by: facilityData.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Add to mock data
      addMockFacility(newFacility);
      console.log('Facility created in mock data:', newFacility);
    }

    // Revalidate the facilities page to reflect the new data
    revalidatePath('/facilities');
  } catch (error) {
    console.error('Error creating facility:', error);
    throw error;
  }
}

export async function getAllFacilities() {
  try {
    console.log('Fetching all facilities...');
    // Always try database first
    const facilities = await FacilityService.getAllFacilities();
    console.log(`Found ${facilities.length} facilities in database`);
    return facilities;
  } catch (error) {
    console.error('Error fetching facilities from database:', error);
    
    // Only use mock data as fallback
    console.log('Using mock data as fallback');
    return getMockFacilities();
  }
}

export async function getFacilityById(id: string) {
  try {
    console.log(`Fetching facility with ID ${id}...`);
    // Always try database first
    const facility = await FacilityService.getFacilityById(id);
    if (facility) {
      console.log('Found facility in database');
      return facility;
    }
  } catch (error) {
    console.error(`Error fetching facility with ID ${id} from database:`, error);
  }
  
  // Check mock data as fallback
  console.log('Checking mock data for facility');
  const mockFacility = getMockFacilityById(id);
  if (mockFacility) {
    console.log('Found facility in mock data');
    return mockFacility;
  }
  
  throw new Error(`Facility with ID ${id} not found`);
}

export async function updateFacility(id: string, formData: FormData) {
  try {
    const name = formData.get('name');
    const address = formData.get('address');
    const city = formData.get('city');
    const state = formData.get('state');
    const zip = formData.get('zip');
    const type = formData.get('type') as FacilityType;
    const status = formData.get('status') as FacilityStatus;
    const squareFootage = formData.get('squareFootage') ? Number(formData.get('squareFootage')) : null;
    const yearBuilt = formData.get('yearBuilt') ? formData.get('yearBuilt')?.toString() : null;
    const facilityConditionIndex = formData.get('facilityConditionIndex') ? Number(formData.get('facilityConditionIndex')) : null;
    const notes = formData.get('notes');

    if (!name || !address || !city || !state || !zip || !type || !status || !squareFootage || !facilityConditionIndex) {
      throw new Error('Missing required facility information');
    }

    const facilityData: FacilityFormData = {
      name: name.toString(),
      facility_type: type,
      address: `${address}, ${city}, ${state} ${zip}`,
      total_square_footage: squareFootage,
      year_built: yearBuilt || new Date().getFullYear().toString(),
      facility_condition_index: facilityConditionIndex,
      status: status,
    };

    await FacilityService.updateFacility(id, facilityData);
    revalidatePath('/facilities');
    revalidatePath(`/facilities/${id}`);
  } catch (error) {
    console.error(`Error updating facility with ID ${id}:`, error);
    throw error;
  }
}

export async function deleteFacility(id: string) {
  try {
    await FacilityService.deleteFacility(id);
    revalidatePath('/facilities');
  } catch (error) {
    console.error(`Error deleting facility with ID ${id}:`, error);
    throw error;
  }
} 

export async function updateFacilityMatterportUrl(id: string, matterportUrl: string) {
  try {
    // Create service role client for development
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Update the facility with the new Matterport URL
    const { error } = await serviceRoleClient
      .from('facilities')
      .update({ matterport_url: matterportUrl || null })
      .eq('id', id);

    if (error) {
      console.error('Error updating Matterport URL:', error);
      throw error;
    }

    // Revalidate the facility page
    revalidatePath(`/facility/${id}`);
  } catch (error) {
    console.error(`Error updating Matterport URL for facility ${id}:`, error);
    throw error;
  }
} 