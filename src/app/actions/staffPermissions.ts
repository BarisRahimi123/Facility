import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';

export interface StaffPermissions {
  manage_calendar: boolean;
  create_blockouts: boolean;
  view_reservations: boolean;
  manage_reservations: boolean;
  view_reports: boolean;
}

export interface UserFacilityPermissions {
  facility_id: string;
  permissions: StaffPermissions;
  role: string;
  can_edit: boolean;
  can_delete: boolean;
  can_create_facility: boolean;
  can_share: boolean;
}

export interface UserPermissionsSummary {
  is_admin: boolean;
  is_staff: boolean;
  user_role: string;
  facility_permissions: UserFacilityPermissions[];
  can_create_facility: boolean;
  can_share_all: boolean;
}

export async function getUserPermissions(): Promise<UserPermissionsSummary | null> {
  try {
    const supabase = typeof window === 'undefined'
      ? await createServerSupabaseClient()
      : createBrowserSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return null;
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return null;
    }

    const userRole = userProfile.role;

    // Check if user is admin
    const adminRoles = ['master_admin', 'sub_admin', 'district_approver', 'site_approver'];
    const isAdmin = adminRoles.includes(userRole);

    // Check if user is staff
    const staffRoles = ['staff', 'manager', 'coordinator'];
    const isStaff = staffRoles.includes(userRole);

    // Get staff facility assignments if user is staff
    let facilityPermissions: UserFacilityPermissions[] = [];
    
    if (isStaff) {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('staff_facility_assignments')
        .select('facility_id, permissions, role')
        .eq('user_id', user.id);

      if (!assignmentsError && assignments) {
        facilityPermissions = assignments.map(assignment => ({
          facility_id: assignment.facility_id,
          permissions: assignment.permissions,
          role: assignment.role,
          can_edit: assignment.permissions.manage_calendar || assignment.role === 'manager',
          can_delete: false, // Only admins can delete facilities
          can_create_facility: false, // Only admins can create facilities
          can_share: assignment.permissions.view_reservations
        }));
      }
    }

    return {
      is_admin: isAdmin,
      is_staff: isStaff,
      user_role: userRole,
      facility_permissions: facilityPermissions,
      can_create_facility: isAdmin,
      can_share_all: isAdmin || userRole === 'manager'
    };

  } catch (error) {
    console.error('Error getting user permissions:', error);
    return null;
  }
}

export async function checkFacilityPermission(facilityId: string, permission: keyof StaffPermissions): Promise<boolean> {
  try {
    const supabase = typeof window === 'undefined'
      ? await createServerSupabaseClient()
      : createBrowserSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return false;
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return false;
    }

    const userRole = userProfile.role;

    // Check if user is admin (admins have all permissions)
    const adminRoles = ['master_admin', 'sub_admin', 'district_approver', 'site_approver'];
    if (adminRoles.includes(userRole)) {
      return true;
    }

    // Check staff assignments
    const { data: assignment, error: assignmentError } = await supabase
      .from('staff_facility_assignments')
      .select('permissions')
      .eq('user_id', user.id)
      .eq('facility_id', facilityId)
      .single();

    if (assignmentError || !assignment) {
      return false;
    }

    return assignment.permissions[permission] === true;

  } catch (error) {
    console.error('Error checking facility permission:', error);
    return false;
  }
}

export async function getStaffAssignedFacilities(): Promise<string[]> {
  try {
    const supabase = typeof window === 'undefined'
      ? await createServerSupabaseClient()
      : createBrowserSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return [];
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return [];
    }

    const userRole = userProfile.role;

    // Check if user is admin (admins can see all facilities)
    const adminRoles = ['master_admin', 'sub_admin', 'district_approver', 'site_approver'];
    if (adminRoles.includes(userRole)) {
      // Return all facility IDs
      const { data: allFacilities, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id');

      if (facilitiesError) {
        return [];
      }

      return allFacilities.map(f => f.id);
    }

    // Get staff assigned facilities
    const { data: assignments, error: assignmentsError } = await supabase
      .from('staff_facility_assignments')
      .select('facility_id')
      .eq('user_id', user.id);

    if (assignmentsError || !assignments) {
      return [];
    }

    return assignments.map(a => a.facility_id);

  } catch (error) {
    console.error('Error getting staff assigned facilities:', error);
    return [];
  }
} 