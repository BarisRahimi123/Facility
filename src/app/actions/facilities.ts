'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FacilityService } from '@/lib/services/facility.service';
import type { FacilityFormData, FacilityType, FacilityStatus, Facility } from '@/types/facility';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';


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

// Create service role client for direct database operations
function getServiceRoleSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export async function createFacility(formData: FormData) {
  try {
    const serviceRoleClient = getServiceRoleSupabase();

    // Extract form data
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zip = formData.get('zip') as string;
    const type = formData.get('type') as string;
    const status = formData.get('status') as string;
    const squareFootage = formData.get('squareFootage') as string;
    const yearBuilt = formData.get('yearBuilt') as string;
    const facilityConditionIndex = formData.get('facilityConditionIndex') as string;
    const notes = formData.get('notes') as string;

    console.log('Form data extracted:', {
      name, address, city, state, zip, type, status, 
      squareFootage, yearBuilt, facilityConditionIndex, 
      notes
    });

    // Prepare facility data
    const facilityData = {
      name,
      address: `${address}, ${city}, ${state} ${zip}`,
      facility_type: type as FacilityType,
      status: status as FacilityStatus,
      square_footage: parseInt(squareFootage || '0'),
      year_built: yearBuilt ? parseInt(yearBuilt) : null,
      facility_condition_index: parseInt(facilityConditionIndex || '0'),
      description: notes || null,
    };

    console.log('Creating facility with data:', facilityData);

    const { data, error } = await serviceRoleClient
      .from('facilities')
      .insert([facilityData])
      .select()
      .single();

    if (error) {
      console.error('Database error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
    }

    console.log('Facility created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating facility:', error);
    throw error;
  }
}

export async function getAllFacilities() {
  try {
    console.log('Fetching all facilities...');
    const facilities = await FacilityService.getAllFacilities();
    console.log(`Found ${facilities.length} facilities in database`);
    return facilities;
  } catch (error) {
    console.error('Error fetching facilities from database:', error);
    throw error;
  }
}

export async function getFacilityById(id: string) {
  try {
    console.log(`Fetching facility with ID ${id}...`);
    const facility = await FacilityService.getFacilityById(id);
    if (facility) {
      console.log('Found facility in database');
      return facility;
    }
    throw new Error(`Facility with ID ${id} not found`);
  } catch (error) {
    console.error(`Error fetching facility with ID ${id} from database:`, error);
    throw error;
  }
}

export async function updateFacility(id: string, formData: FormData) {
  try {
    const serviceRoleClient = getServiceRoleSupabase();

    // Extract form data
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

    // Update facility with all fields
    const updateData = {
      name: name.toString(),
      facility_type: type,
      address: `${address}, ${city}, ${state} ${zip}`,
      square_footage: squareFootage,
      year_built: yearBuilt ? parseInt(yearBuilt) : null,
      facility_condition_index: facilityConditionIndex,
      status: status,
      description: notes?.toString() || '',
    };

    console.log('Updating facility with data:', updateData);

    const { error } = await serviceRoleClient
      .from('facilities')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating facility:', error);
      throw error;
    }

    console.log('Facility updated successfully');
    revalidatePath('/facilities');
    revalidatePath(`/facility/${id}`);
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

export async function getFacilitiesForAnalytics() {
  try {
    console.log('Fetching facilities for analytics...');
    const serviceRoleClient = getServiceRoleSupabase();
    
    const { data, error } = await serviceRoleClient
      .from('facilities')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching facilities for analytics:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} facilities for analytics`);
    return data || [];
  } catch (error) {
    console.error('Error in getFacilitiesForAnalytics:', error);
    throw error;
  }
} 

export async function getFacilitiesForMap() {
  try {
    console.log('Getting facilities for map...');
    
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await serviceRoleClient
      .from('facilities')
      .select('id, name, address, facility_type, status, square_footage, year_built')
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching facilities for map:', error);
      console.error('Error details:', error.message);
      return []; // Return empty array instead of throwing
    }

    console.log(`Found ${data?.length || 0} facilities for map`);
    return data || [];
  } catch (error) {
    console.error('Failed to get facilities for map:', error);
    return []; // Return empty array on error
  }
}

export async function getFacilitiesForCurrentUser() {
  try {
    console.log('Getting facilities for current user...');
    
    // Get current user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user, returning all facilities');
      return getFacilitiesForMap(); // Fallback for unauthenticated users
    }

    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    const userRole = userProfile?.role;
    console.log(`User role: ${userRole}`);

    // Use the service role client with proper fallback
    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = serviceRoleClient
      .from('facilities')
      .select('id, name, address, facility_type, status, square_footage, year_built')
      .eq('status', 'active');

    // Apply role-based filtering - for now, let renters see all facilities
    // This can be refined later based on actual facility types in the database
    if (userRole === 'renter') {
      console.log('Renter user - showing all available facilities');
      // For now, show all active facilities to renter users
      // Later we can add more specific filtering based on actual facility types
    }
    // Staff, managers, coordinators, and admins can see all facilities

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching facilities for user:', error);
      console.error('Error details:', error.message);
      // Return all facilities as fallback instead of throwing
      return getFacilitiesForMap();
    }

    console.log(`Found ${data?.length || 0} facilities for user role: ${userRole}`);
    return data || [];
  } catch (error) {
    console.error('Failed to get facilities for current user:', error);
    // Fallback to all facilities if there's an error
    console.log('Falling back to getFacilitiesForMap()');
    return getFacilitiesForMap();
  }
} 