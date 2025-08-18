import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const service = await createServiceSupabaseClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        permissions: null 
      }, { status: 401 });
    }

    // Get user details from database with timeout and using service role client
    let userRecord: any = null;
    try {
      const query = service
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('User query timeout')), 5000));
      const result: any = await Promise.race([query, timeout]);
      userRecord = result?.data || userRecord;
      if (result?.error) throw result.error;
    } catch (dbError: any) {
      console.error('Error fetching user (service role):', dbError);
      // Fallback for master admin
      if (user.email === '85baris@gmail.com') {
        userRecord = { id: user.id, email: user.email, role: 'master_admin' };
      } else {
        return NextResponse.json({ 
          error: 'User not found',
          permissions: null 
        }, { status: 404 });
      }
    }

    if (dbError) {
      console.error('Error fetching user:', dbError);
      return NextResponse.json({ 
        error: 'User not found',
        permissions: null 
      }, { status: 404 });
    }

    // Get facility permissions
    const { data: facilityPermissions } = await service
      .from('staff_facility_assignments')
      .select('*')
      .eq('user_id', user.id);

    // Get field permissions  
    const { data: fieldPermissions } = await service
      .from('staff_field_assignments')
      .select('*')
      .eq('user_id', user.id);

    // Get room permissions
    const { data: roomPermissions } = await service
      .from('staff_room_assignments')
      .select('*')
      .eq('user_id', user.id);

    const role: string | null = userRecord?.role || null;
    const adminRoles = ['admin', 'district_approver', 'site_approver', 'master_admin', 'sub_admin'];
    const isAdmin = !!role && adminRoles.includes(role);
    const isStaff = role === 'staff' || role === 'manager' || role === 'coordinator';

    const facilityPerms = facilityPermissions ?? [];
    const fieldPerms = fieldPermissions ?? [];
    const roomPerms = roomPermissions ?? [];

    const permissions = {
      userId: user.id,
      role,
      organizationId: userRecord?.organization_id || null,
      facilityPermissions: facilityPerms,
      fieldPermissions: fieldPerms,
      roomPermissions: roomPerms,
      canManageAnyCalendar:
        (facilityPerms.some(p => (p as any).manage_calendar) ||
         fieldPerms.some(p => (p as any).manage_calendar) ||
         roomPerms.some(p => (p as any).manage_calendar)) || false,
      canCreateAnyBlockouts:
        (facilityPerms.some(p => (p as any).create_blockouts) ||
         fieldPerms.some(p => (p as any).create_blockouts) ||
         roomPerms.some(p => (p as any).create_blockouts)) || false,
      canViewAnyReservations:
        (facilityPerms.some(p => (p as any).view_reservations) ||
         fieldPerms.some(p => (p as any).view_reservations) ||
         roomPerms.some(p => (p as any).view_reservations)) || false,
      canViewAnyReports:
        (facilityPerms.some(p => (p as any).view_reports) ||
         fieldPerms.some(p => (p as any).view_reports) ||
         roomPerms.some(p => (p as any).view_reports)) || false,

      // Back-compat keys expected by existing client code
      is_admin: isAdmin,
      is_staff: isStaff,
      can_create_facility: isAdmin, // allow admins to create facilities
      can_share_all: isAdmin, // admins can share all facilities
      facility_permissions: facilityPerms.map((p: any) => ({
        facility_id: p.facility_id,
        // Conservative defaults: only admins can edit/delete/share
        can_edit: isAdmin,
        can_delete: isAdmin,
        can_share: isAdmin,
      })),
    } as any;

    return NextResponse.json({ permissions });

  } catch (error) {
    console.error('Error getting user permissions:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      permissions: null 
    }, { status: 500 });
  }
}
