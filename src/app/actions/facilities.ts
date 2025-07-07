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

export async function createFacility(formData: FormData): Promise<{ success: boolean; error?: string; facility?: Facility }> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get user profile and check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { success: false, error: 'User profile not found' };
    }

    const userRole = userProfile.role;

    // Check if user can create facilities (only admins)
    const adminRoles = ['master_admin', 'sub_master', 'district_approver', 'site_approver'];
    if (!adminRoles.includes(userRole)) {
      return { success: false, error: 'You do not have permission to create facilities' };
    }

    // Extract form data
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zip_code = formData.get('zip_code') as string;
    const country = formData.get('country') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const website = formData.get('website') as string;
    const facility_type = formData.get('facility_type') as string;
    const status = formData.get('status') as string;
    const square_footage = formData.get('square_footage') as string;
    const year_built = formData.get('year_built') as string;
    const description = formData.get('description') as string;

    // Validate required fields
    if (!name || !address || !facility_type) {
      return { success: false, error: 'Missing required fields' };
    }

    // Create facility
    const { data: facility, error: createError } = await supabase
      .from('facilities')
      .insert([
        {
          name,
          address,
          city,
          state,
          zip_code,
          country,
          phone,
          email,
          website,
          facility_type,
          status: status || 'active',
          square_footage: square_footage ? parseInt(square_footage) : null,
          year_built: year_built ? parseInt(year_built) : null,
          description,
          occupancy_rate: 0,
          active_issues: 0
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating facility:', createError);
      return { success: false, error: 'Failed to create facility' };
    }

    return { success: true, facility };

  } catch (error) {
    console.error('Error in createFacility:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function getAllFacilities(): Promise<Facility[]> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('User not authenticated');
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      throw new Error('User profile not found');
    }

    const userRole = userProfile.role;

    // Check if user is admin (admins can see all facilities)
    const adminRoles = ['master_admin', 'sub_master', 'district_approver', 'site_approver'];
    const isAdmin = adminRoles.includes(userRole);

    console.log('Getting facilities for current user...');
    console.log('User role:', userRole);

    let facilities: Facility[] = [];

    if (isAdmin) {
      // Admins can see all facilities
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching facilities:', error);
        throw new Error('Failed to fetch facilities');
      }

      facilities = data || [];
      console.log(`Found ${facilities.length} facilities for admin user`);
    } else {
      // Staff users can only see facilities they're assigned to
      const { data: assignments, error: assignmentsError } = await supabase
        .from('staff_facility_assignments')
        .select(`
          facility_id,
          facilities (
            id,
            name,
            address,
            city,
            state,
            zip_code,
            country,
            phone,
            email,
            website,
            facility_type,
            status,
            square_footage,
            year_built,
            occupancy_rate,
            active_issues,
            description,
            image_url,
            image_description,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (assignmentsError) {
        console.error('Error fetching staff assignments:', assignmentsError);
        throw new Error('Failed to fetch staff assignments');
      }

             facilities = assignments?.map(assignment => assignment.facilities).filter(Boolean) as Facility[] || [];
      console.log(`Found ${facilities.length} facilities for staff user`);
    }

    return facilities;

  } catch (error) {
    console.error('Error in getAllFacilities:', error);
    throw error;
  }
}

export async function getFacilityById(id: string): Promise<Facility | null> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('User profile not found');
    }

    const userRole = userProfile.role;

    // Check if user is admin (admins can see all facilities)
    const adminRoles = ['master_admin', 'sub_master', 'district_approver', 'site_approver'];
    const isAdmin = adminRoles.includes(userRole);

    if (isAdmin) {
      // Admins can access any facility
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching facility:', error);
        return null;
      }

      return data;
    } else {
      // Staff users can only access facilities they're assigned to
      const { data: assignment, error: assignmentError } = await supabase
        .from('staff_facility_assignments')
        .select(`
          facility_id,
          facilities (
            id,
            name,
            address,
            city,
            state,
            zip_code,
            country,
            phone,
            email,
            website,
            facility_type,
            status,
            square_footage,
            year_built,
            occupancy_rate,
            active_issues,
            description,
            image_url,
            image_description,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('facility_id', id)
        .single();

      if (assignmentError) {
        console.error('Error fetching staff assignment:', assignmentError);
        return null;
      }

      return assignment?.facilities || null;
    }

  } catch (error) {
    console.error('Error in getFacilityById:', error);
    return null;
  }
}

export async function updateFacility(id: string, formData: FormData): Promise<{ success: boolean; error?: string; facility?: Facility }> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get user profile and check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { success: false, error: 'User profile not found' };
    }

    const userRole = userProfile.role;

    // Check if user can update facilities
    const adminRoles = ['master_admin', 'sub_master', 'district_approver', 'site_approver'];
    const isAdmin = adminRoles.includes(userRole);

    if (!isAdmin) {
      // Check if staff has permission to edit this facility
      const { data: assignment, error: assignmentError } = await supabase
        .from('staff_facility_assignments')
        .select('permissions')
        .eq('user_id', user.id)
        .eq('facility_id', id)
        .single();

      if (assignmentError || !assignment) {
        return { success: false, error: 'You do not have permission to edit this facility' };
      }

      if (!assignment.permissions.manage_calendar) {
        return { success: false, error: 'You do not have permission to edit this facility' };
      }
    }

    // Extract form data
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const zip_code = formData.get('zip_code') as string;
    const country = formData.get('country') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const website = formData.get('website') as string;
    const facility_type = formData.get('facility_type') as string;
    const status = formData.get('status') as string;
    const square_footage = formData.get('square_footage') as string;
    const year_built = formData.get('year_built') as string;
    const description = formData.get('description') as string;

    // Validate required fields
    if (!name || !address || !facility_type) {
      return { success: false, error: 'Missing required fields' };
    }

    // Update facility
    const { data: facility, error: updateError } = await supabase
      .from('facilities')
      .update({
        name,
        address,
        city,
        state,
        zip_code,
        country,
        phone,
        email,
        website,
        facility_type,
        status,
        square_footage: square_footage ? parseInt(square_footage) : null,
        year_built: year_built ? parseInt(year_built) : null,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating facility:', updateError);
      return { success: false, error: 'Failed to update facility' };
    }

    return { success: true, facility };

  } catch (error) {
    console.error('Error in updateFacility:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteFacility(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get user profile and check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return { success: false, error: 'User profile not found' };
    }

    const userRole = userProfile.role;

    // Check if user can delete facilities (only admins)
    const adminRoles = ['master_admin', 'sub_master', 'district_approver', 'site_approver'];
    if (!adminRoles.includes(userRole)) {
      return { success: false, error: 'You do not have permission to delete facilities' };
    }

    // Delete facility
    const { error: deleteError } = await supabase
      .from('facilities')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting facility:', deleteError);
      return { success: false, error: 'Failed to delete facility' };
    }

    return { success: true };

  } catch (error) {
    console.error('Error in deleteFacility:', error);
    return { success: false, error: 'An unexpected error occurred' };
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