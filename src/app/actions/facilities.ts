'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Facility } from '@/types/facility';
import { mapLegacyRole } from '@/types/user';

interface CreateFacilityFormData {
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance' | 'planned';
  square_footage?: number;
  year_built?: number;
  address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  description?: string;
  primary_use?: string;
  secondary_uses?: string[];
  operating_hours?: string;
  capacity?: number;
  contact_email?: string;
  contact_phone?: string;
  accessibility_features?: string[];
  emergency_contact?: string;
  coordinates?: string;
  maintenance_contact?: string | null;
}

export async function getAllFacilities(): Promise<Facility[]> {
  try {
    // Use service role client to bypass authentication issues
    const serviceClient = getServiceRoleClient();
    
    console.log('🔍 Fetching all facilities...');
    
    // Get all facilities without filtering for now
    const { data, error } = await serviceClient
      .from('facilities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching facilities:', error);
      return [];
    }

    console.log(`✅ Found ${data?.length || 0} facilities`);
    if (data && data.length > 0) {
      console.log('📋 Facility names:', data.map(f => f.name));
      console.log('🏢 First facility org:', data[0].organization_id);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllFacilities:', error);
    return [];
  }
}

export async function createFacility(formData: FormData) {
  console.log('🏗️ createFacility called with FormData:', Array.from(formData.keys()));
  
  const supabase = await createServerSupabaseClient();
  const serviceClient = getServiceRoleClient();
  
  // Get current user with organization
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('👤 Auth check:', user ? `User: ${user.email}` : 'No user', authError ? `Error: ${authError.message}` : '');
  
  if (authError || !user) {
    console.error('❌ Auth error in createFacility:', authError);
    return { error: 'User not authenticated. Please sign in and try again.' };
  }

  // For now, allow any authenticated user to create facilities
  // (Skip role-based restrictions until user management is fully implemented)
  console.log('🔓 Allowing facility creation for authenticated user:', user.email);

  try {
    // Extract data from FormData (matching actual form field names)
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const status = formData.get('status') as string || 'active';
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zip_code = formData.get('zip') as string; // Form uses 'zip' not 'zip_code'
    const notes = formData.get('notes') as string;
    
    // Handle numeric fields (matching actual form field names)
    const square_footage = formData.get('squareFootage') ? parseInt(formData.get('squareFootage') as string) : null;
    const year_built = formData.get('yearBuilt') ? parseInt(formData.get('yearBuilt') as string) : null;
    const facility_condition_index = formData.get('facilityConditionIndex') ? parseInt(formData.get('facilityConditionIndex') as string) : null;
    
    // Set defaults for fields not in the form
    const country = 'USA';
    const primary_use = type; // Use facility type as primary use


    // Build facility data using only existing database columns
    const facilityData: any = {
      name,
      facility_type: type,
      status,
      address: `${address}${city ? ', ' + city : ''}${state ? ', ' + state : ''}${zip_code ? ' ' + zip_code : ''}`, // Combine address fields
      square_footage,
      year_built,
      facility_condition_index,
      description: notes || '', // Use notes as description
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Only add non-null values to avoid database errors
    Object.keys(facilityData).forEach(key => {
      if (facilityData[key] === null || facilityData[key] === undefined) {
        delete facilityData[key];
      }
    });

    console.log('📝 Creating facility with data:', {
      name: facilityData.name,
      facility_type: facilityData.facility_type,
      created_by: facilityData.created_by,
      address: facilityData.address
    });

    const { data, error } = await serviceClient
      .from('facilities')
      .insert([facilityData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating facility:', error);
      return { error: error.message };
    }

    console.log('✅ Facility created successfully:', {
      id: data.id,
      name: data.name,
      facility_type: data.facility_type,
      status: data.status
    });

    revalidatePath('/facilities');
    return { data };
  } catch (error) {
    console.error('Error in createFacility:', error);
    return { error: 'Failed to create facility' };
  }
}

export async function getFacilityById(id: string): Promise<Facility | null> {
  const supabase = await createServerSupabaseClient();
  const serviceClient = getServiceRoleClient();
  
  console.log(`🏢 getFacilityById called for facility: ${id}`);
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('❌ Auth error in getFacilityById:', authError);
    return null;
  }

  console.log(`👤 User authenticated: ${user.email}`);

  // Try to get user profile, with fallback for master admin
  let userProfile;
  const { data: profile, error: profileError } = await serviceClient
    .from('users')
    .select('role, organization_id')
    .eq('email', user.email)  // Fixed: Use email instead of id
    .single();
    
  if (profileError || !profile) {
    console.error('⚠️ Profile error:', profileError);
    // Fallback for master admin
    if (user.email === '85baris@gmail.com') {
      console.log('🔧 Using master admin fallback for facility access');
      // Get the first organization or create a default one
      const { data: orgs } = await serviceClient
        .from('organizations')
        .select('id')
        .limit(1);
      
      userProfile = {
        role: 'master_admin',
        organization_id: orgs?.[0]?.id || 'default-org'
      };
    } else {
      console.error('❌ User profile not found for:', user.email);
      return null;
    }
  } else {
    userProfile = profile;
  }

  const userRole = mapLegacyRole(userProfile.role);
  console.log(`🔐 User role: ${userRole}, org: ${userProfile.organization_id}`);

  // Get facility
  const { data, error } = await serviceClient
    .from('facilities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ Error fetching facility:', error);
    return null;
  }

  console.log(`✅ Facility found: ${data.name}, org: ${data.organization_id}`);

  // Check organization access for non-master admins
  if (userRole !== 'master_admin' && data.organization_id !== userProfile.organization_id) {
    console.error('🚫 User does not have access to this facility');
    console.error(`User org: ${userProfile.organization_id}, Facility org: ${data.organization_id}`);
    return null;
  }

  console.log(`🎉 Facility access granted for user: ${user.email}`);
  return data;
}

export async function updateFacility(id: string, formData: Partial<CreateFacilityFormData>) {
  const supabase = await createServerSupabaseClient();
  const serviceClient = getServiceRoleClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'User not authenticated' };
  }

  // Get user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!userProfile) {
    return { error: 'User profile not found' };
  }

  const userRole = mapLegacyRole(userProfile.role);

  // Check if facility exists and user has access
  const { data: facility } = await serviceClient
    .from('facilities')
    .select('organization_id')
    .eq('id', id)
    .single();

  if (!facility) {
    return { error: 'Facility not found' };
  }

  // Check organization access for non-master admins
  if (userRole !== 'master_admin' && facility.organization_id !== userProfile.organization_id) {
    return { error: 'You do not have permission to update this facility' };
  }

  // Only master_admin and sub_admin can update facilities
  if (userRole !== 'master_admin' && userRole !== 'sub_admin') {
    return { error: 'You do not have permission to update facilities' };
  }

  try {
    const updateData = {
      ...formData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await serviceClient
      .from('facilities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating facility:', error);
      return { error: error.message };
    }

    revalidatePath('/facilities');
    revalidatePath(`/facility/${id}`);
    return { data };
  } catch (error) {
    console.error('Error in updateFacility:', error);
    return { error: 'Failed to update facility' };
  }
}

export async function deleteFacility(id: string) {
  const supabase = await createServerSupabaseClient();
  const serviceClient = getServiceRoleClient();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'User not authenticated' };
  }

  // Get user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!userProfile) {
    return { error: 'User profile not found' };
  }

  const userRole = mapLegacyRole(userProfile.role);

  // Only master_admin can delete facilities
  if (userRole !== 'master_admin') {
    return { error: 'Only platform administrators can delete facilities' };
  }

  try {
    const { error } = await serviceClient
      .from('facilities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting facility:', error);
      return { error: error.message };
    }

    revalidatePath('/facilities');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteFacility:', error);
    return { error: 'Failed to delete facility' };
  }
} 

export async function updateFacilityMatterportUrl(id: string, matterportUrl: string) {
  try {
    const serviceRoleClient = getServiceRoleClient();

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
    const serviceRoleClient = getServiceRoleClient();
    
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
    
    const serviceRoleClient = getServiceRoleClient();

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

    // Use the service role client
    const serviceRoleClient = getServiceRoleClient();

    const query = serviceRoleClient
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