'use server';

import { createServerSupabaseClient as createClient } from '@/lib/supabase/server';
import type { 
  StaffFacilityAssignment, 
  StaffFieldAssignment,
  StaffRoomAssignment,
  FieldBlockoutDate,
  RoomBlockoutDate,
  CreateBlockoutFormData,
  UpdateBlockoutFormData,
  CreateFieldAssignmentFormData,
  CreateRoomAssignmentFormData,
  StaffDashboardData,
  StaffAssignmentResponse,
  StaffFieldAssignmentResponse,
  StaffRoomAssignmentResponse,
  BlockoutResponse,
  StaffDashboardResponse,
  AssignmentUser,
  AssignmentField,
  AssignmentRoom
} from '@/types/staff';

// Get staff assignments for current user
export async function getStaffAssignments(): Promise<StaffAssignmentResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('staff_facility_assignments')
      .select(`
        *,
        facilities (
          id,
          name,
          address,
          facility_type,
          status
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching staff assignments:', error);
      return { data: null, error: error.message };
    }

    return { data: data as StaffFacilityAssignment[], error: null };
  } catch (error) {
    console.error('Error in getStaffAssignments:', error);
    return { data: null, error: 'Failed to fetch assignments' };
  }
}

// Get staff field assignments for current user
export async function getStaffFieldAssignments(): Promise<StaffFieldAssignmentResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('staff_field_assignments')
      .select(`
        *,
        fields (
          id,
          name,
          type,
          status,
          hourly_rate,
          facility_id,
          facilities (
            name
          )
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching staff field assignments:', error);
      return { data: null, error: error.message };
    }

    return { data: data as StaffFieldAssignment[], error: null };
  } catch (error) {
    console.error('Error in getStaffFieldAssignments:', error);
    return { data: null, error: 'Failed to fetch field assignments' };
  }
}

// Get all staff assignments for a specific field
export async function getFieldStaffAssignments(fieldId: string): Promise<StaffFieldAssignmentResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('staff_field_assignments')
      .select(`
        *,
        users:user_id (
          id,
          email,
          full_name,
          role
        ),
        fields:field_id (
          id,
          name,
          facility_id
        )
      `)
      .eq('field_id', fieldId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching field staff assignments:', error);
      return { data: null, error: error.message };
    }

    return { data: data as StaffFieldAssignment[], error: null };
  } catch (error) {
    console.error('Error in getFieldStaffAssignments:', error);
    return { data: null, error: 'Failed to fetch field staff assignments' };
  }
}

// Get staff room assignments for current user
export async function getStaffRoomAssignments(): Promise<StaffRoomAssignmentResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('staff_room_assignments')
      .select(`
        *,
        rooms (
          id,
          number,
          type,
          building_id,
          buildings (
            name,
            facility_id,
            facilities (
              name
            )
          )
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching staff room assignments:', error);
      return { data: null, error: error.message };
    }

    return { data: data as StaffRoomAssignment[], error: null };
  } catch (error) {
    console.error('Error in getStaffRoomAssignments:', error);
    return { data: null, error: 'Failed to fetch room assignments' };
  }
}

// Get staff dashboard data
export async function getStaffDashboardData(): Promise<StaffDashboardResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Get staff assignments with facility and field data
    const { data: assignments, error: assignmentsError } = await supabase
      .from('staff_facility_assignments')
      .select(`
        *,
        facilities (
          id,
          name,
          address,
          facility_type,
          status,
          fields (
            id,
            name,
            type,
            status,
            hourly_rate
          )
        )
      `)
      .eq('user_id', user.id);

    if (assignmentsError) {
      return { data: null, error: assignmentsError.message };
    }

    // Get field assignments
    const { data: fieldAssignments, error: fieldAssignmentsError } = await supabase
      .from('staff_field_assignments')
      .select(`
        *,
        fields (
          id,
          name,
          type,
          status,
          hourly_rate,
          facility_id,
          facilities (
            name
          )
        )
      `)
      .eq('user_id', user.id);

    if (fieldAssignmentsError) {
      console.error('Error fetching field assignments:', fieldAssignmentsError);
    }

    // Get room assignments
    const { data: roomAssignments, error: roomAssignmentsError } = await supabase
      .from('staff_room_assignments')
      .select(`
        *,
        rooms (
          id,
          number,
          type,
          building_id,
          buildings (
            name,
            facility_id,
            facilities (
              name
            )
          )
        )
      `)
      .eq('user_id', user.id);

    if (roomAssignmentsError) {
      console.error('Error fetching room assignments:', roomAssignmentsError);
    }

    // Get upcoming field blockouts for assigned fields
    const fieldIds = fieldAssignments?.map((a: any) => a.field_id) || [];
    let fieldBlockouts: any[] = [];
    if (fieldIds.length > 0) {
      const { data: fieldBlockoutsData, error: fieldBlockoutsError } = await supabase
        .from('field_blockout_dates')
        .select(`
          *,
          fields (
            id,
            name,
            facility_id
          )
        `)
        .in('field_id', fieldIds)
        .eq('status', 'active')
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(10);

      if (fieldBlockoutsError) {
        console.error('Error fetching field blockouts:', fieldBlockoutsError);
      } else {
        fieldBlockouts = fieldBlockoutsData || [];
      }
    }

    // Get upcoming room blockouts for assigned rooms
    const roomIds = roomAssignments?.map((a: any) => a.room_id) || [];
    let roomBlockouts: any[] = [];
    if (roomIds.length > 0) {
      const { data: roomBlockoutsData, error: roomBlockoutsError } = await supabase
        .from('room_blockout_dates')
        .select(`
          *,
          rooms (
            id,
            number,
            building_id,
            buildings (
              name,
              facility_id,
              facilities (
                name
              )
            )
          )
        `)
        .in('room_id', roomIds)
        .eq('status', 'active')
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
        .limit(10);

      if (roomBlockoutsError) {
        console.error('Error fetching room blockouts:', roomBlockoutsError);
      } else {
        roomBlockouts = roomBlockoutsData || [];
      }
    }

    // Get recent reservations (mock for now)
    const recentReservations: any[] = [];

    // Transform data
    const facilities = assignments?.map((assignment: any) => ({
      id: assignment.facilities.id,
      name: assignment.facilities.name,
      address: assignment.facilities.address,
      facility_type: assignment.facilities.facility_type,
      status: assignment.facilities.status,
      fields: assignment.facilities.fields.map((field: any) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        status: field.status,
        hourly_rate: field.hourly_rate,
        facility_id: assignment.facilities.id,
        blockouts: []
      }))
    })) || [];

    // Transform assigned fields
    const assignedFields = fieldAssignments?.map((assignment: any) => ({
      id: assignment.fields.id,
      name: assignment.fields.name,
      type: assignment.fields.type,
      status: assignment.fields.status,
      hourly_rate: assignment.fields.hourly_rate,
      facility_id: assignment.fields.facility_id,
      facility_name: assignment.fields.facilities.name,
      blockouts: []
    })) || [];

    // Transform assigned rooms
    const assignedRooms = roomAssignments?.map((assignment: any) => ({
      id: assignment.rooms.id,
      number: assignment.rooms.number,
      type: assignment.rooms.type,
      building_id: assignment.rooms.building_id,
      building_name: assignment.rooms.buildings.name,
      facility_id: assignment.rooms.buildings.facility_id,
      facility_name: assignment.rooms.buildings.facilities.name,
      blockouts: []
    })) || [];

    const dashboardData: StaffDashboardData = {
      assignments: assignments || [],
      field_assignments: fieldAssignments || [],
      room_assignments: roomAssignments || [],
      facilities,
      assigned_fields: assignedFields,
      assigned_rooms: assignedRooms,
      upcoming_blockouts: [...fieldBlockouts, ...roomBlockouts],
      recent_reservations: recentReservations
    };

    return { data: dashboardData, error: null };
  } catch (error) {
    console.error('Error in getStaffDashboardData:', error);
    return { data: null, error: 'Failed to fetch dashboard data' };
  }
}

// Get blockouts for a specific field
export async function getFieldBlockouts(fieldId: string): Promise<BlockoutResponse> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('field_blockout_dates')
      .select('*')
      .eq('field_id', fieldId)
      .eq('status', 'active')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching field blockouts:', error);
      return { data: null, error: error.message };
    }

    return { data: data as FieldBlockoutDate[], error: null };
  } catch (error) {
    console.error('Error in getFieldBlockouts:', error);
    return { data: null, error: 'Failed to fetch blockouts' };
  }
}

// Get blockouts for a specific room
export async function getRoomBlockouts(roomId: string): Promise<BlockoutResponse> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('room_blockout_dates')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'active')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching room blockouts:', error);
      return { data: null, error: error.message };
    }

    return { data: data as RoomBlockoutDate[], error: null };
  } catch (error) {
    console.error('Error in getRoomBlockouts:', error);
    return { data: null, error: 'Failed to fetch blockouts' };
  }
}

// Create a new blockout
export async function createBlockout(formData: CreateBlockoutFormData): Promise<BlockoutResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    if (formData.field_id) {
      // Handle field blockout
      const { data: fieldData, error: fieldError } = await supabase
        .from('fields')
        .select('facility_id')
        .eq('id', formData.field_id)
        .single();

      if (fieldError || !fieldData) {
        return { data: null, error: 'Field not found' };
      }

      // Check if user is a master admin or has permission to create blockouts for this field
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const isMasterAdmin = userData?.role === 'master_admin' || userData?.role === 'district_approver';

      if (!isMasterAdmin) {
        // Check if user has permission through staff assignment
        const { data: hasPermission, error: permissionError } = await supabase
          .from('staff_field_assignments')
          .select('permissions')
          .eq('user_id', user.id)
          .eq('field_id', formData.field_id)
          .single();

        if (permissionError || !hasPermission?.permissions?.create_blockouts) {
          return { data: null, error: 'Insufficient permissions' };
        }
      }

      const { data, error } = await supabase
        .from('field_blockout_dates')
        .insert([
          {
            field_id: formData.field_id,
            start_date: formData.start_date,
            end_date: formData.end_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            reason: formData.reason,
            description: formData.description,
            recurring: formData.recurring,
            recurring_pattern: formData.recurring_pattern,
            created_by: user.id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating field blockout:', error);
        return { data: null, error: error.message };
      }

      return { data: [data as FieldBlockoutDate], error: null };
    } else if (formData.room_id) {
      // Handle room blockout
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select(`
          building_id,
          buildings (
            facility_id
          )
        `)
        .eq('id', formData.room_id)
        .single();

      if (roomError || !roomData) {
        return { data: null, error: 'Room not found' };
      }

      // Check if user has permission to create blockouts for this room
      const { data: hasPermission, error: permissionError } = await supabase
        .from('staff_room_assignments')
        .select('permissions')
        .eq('user_id', user.id)
        .eq('room_id', formData.room_id)
        .single();

      if (permissionError || !hasPermission?.permissions?.create_blockouts) {
        return { data: null, error: 'Insufficient permissions' };
      }

      const { data, error } = await supabase
        .from('room_blockout_dates')
        .insert([
          {
            room_id: formData.room_id,
            start_date: formData.start_date,
            end_date: formData.end_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            reason: formData.reason,
            description: formData.description,
            recurring: formData.recurring,
            recurring_pattern: formData.recurring_pattern,
            created_by: user.id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating room blockout:', error);
        return { data: null, error: error.message };
      }

      return { data: [data as RoomBlockoutDate], error: null };
    } else {
      return { data: null, error: 'Either field_id or room_id must be provided' };
    }
  } catch (error) {
    console.error('Error in createBlockout:', error);
    return { data: null, error: 'Failed to create blockout' };
  }
}

// Update a blockout
export async function updateBlockout(formData: UpdateBlockoutFormData): Promise<BlockoutResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Check if user has permission to update this blockout
    const { data: blockout, error: blockoutError } = await supabase
      .from('field_blockout_dates')
      .select(`
        *,
        fields (
          facility_id
        )
      `)
      .eq('id', formData.id)
      .single();

    if (blockoutError || !blockout) {
      return { data: null, error: 'Blockout not found' };
    }

    const { data: hasPermission, error: permissionError } = await supabase
      .from('staff_facility_assignments')
      .select('permissions')
      .eq('user_id', user.id)
      .eq('facility_id', (blockout as any).fields.facility_id)
      .single();

    if (permissionError || !hasPermission?.permissions?.create_blockouts) {
      return { data: null, error: 'Insufficient permissions' };
    }

    const { id, ...updateData } = formData;
    const { data, error } = await supabase
      .from('field_blockout_dates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating blockout:', error);
      return { data: null, error: error.message };
    }

    return { data: [data as FieldBlockoutDate], error: null };
  } catch (error) {
    console.error('Error in updateBlockout:', error);
    return { data: null, error: 'Failed to update blockout' };
  }
}

// Delete/cancel a blockout
export async function deleteBlockout(blockoutId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'User not authenticated' };
    }

    // Check if user has permission to delete this blockout
    const { data: blockout, error: blockoutError } = await supabase
      .from('field_blockout_dates')
      .select(`
        *,
        fields (
          facility_id
        )
      `)
      .eq('id', blockoutId)
      .single();

    if (blockoutError || !blockout) {
      return { error: 'Blockout not found' };
    }

    // Check if user is a master admin or has permission to delete this blockout
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isMasterAdmin = userData?.role === 'master_admin' || userData?.role === 'district_approver';

    if (!isMasterAdmin) {
      // Check if user has permission through facility assignment
      const { data: hasPermission, error: permissionError } = await supabase
        .from('staff_facility_assignments')
        .select('permissions')
        .eq('user_id', user.id)
        .eq('facility_id', (blockout as any).fields.facility_id)
        .single();

      if (permissionError || !hasPermission?.permissions?.create_blockouts) {
        return { error: 'Insufficient permissions' };
      }
    }

    // Instead of deleting, mark as cancelled to maintain history
    const { error } = await supabase
      .from('field_blockout_dates')
      .update({ status: 'cancelled' })
      .eq('id', blockoutId);

    if (error) {
      console.error('Error deleting blockout:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteBlockout:', error);
    return { error: 'Failed to delete blockout' };
  }
}

// Get blockouts for multiple fields (for calendar view)
export async function getBlockoutsForFields(fieldIds: string[]): Promise<BlockoutResponse> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('field_blockout_dates')
      .select(`
        *,
        fields (
          id,
          name,
          type
        )
      `)
      .in('field_id', fieldIds)
      .eq('status', 'active')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching blockouts for fields:', error);
      return { data: null, error: error.message };
    }

    return { data: data as FieldBlockoutDate[], error: null };
  } catch (error) {
    console.error('Error in getBlockoutsForFields:', error);
    return { data: null, error: 'Failed to fetch blockouts' };
  }
}

// Get blockouts for multiple rooms (for calendar view)
export async function getBlockoutsForRooms(roomIds: string[]): Promise<BlockoutResponse> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('room_blockout_dates')
      .select(`
        *,
        rooms (
          id,
          number,
          type
        )
      `)
      .in('room_id', roomIds)
      .eq('status', 'active')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching blockouts for rooms:', error);
      return { data: null, error: error.message };
    }

    return { data: data as RoomBlockoutDate[], error: null };
  } catch (error) {
    console.error('Error in getBlockoutsForRooms:', error);
    return { data: null, error: 'Failed to fetch blockouts' };
  }
}

// ASSIGNMENT MANAGEMENT FUNCTIONS

// Create field assignment
export async function createFieldAssignment(formData: CreateFieldAssignmentFormData): Promise<StaffFieldAssignmentResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Get field data to populate facility_id
    const { data: fieldData, error: fieldError } = await supabase
      .from('fields')
      .select('facility_id')
      .eq('id', formData.field_id)
      .single();

    if (fieldError || !fieldData) {
      return { data: null, error: 'Field not found' };
    }

    const { data, error } = await supabase
      .from('staff_field_assignments')
      .insert([
        {
          ...formData,
          facility_id: fieldData.facility_id,
          assigned_by: user.id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating field assignment:', error);
      return { data: null, error: error.message };
    }

    return { data: [data as StaffFieldAssignment], error: null };
  } catch (error) {
    console.error('Error in createFieldAssignment:', error);
    return { data: null, error: 'Failed to create field assignment' };
  }
}

// Create room assignment
export async function createRoomAssignment(formData: CreateRoomAssignmentFormData): Promise<StaffRoomAssignmentResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Get room data to populate building_id and facility_id
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select(`
        building_id,
        buildings (
          facility_id
        )
      `)
      .eq('id', formData.room_id)
      .single();

    if (roomError || !roomData) {
      return { data: null, error: 'Room not found' };
    }

    const { data, error } = await supabase
      .from('staff_room_assignments')
      .insert([
        {
          ...formData,
          building_id: roomData.building_id,
          facility_id: (roomData as any).buildings.facility_id,
          assigned_by: user.id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating room assignment:', error);
      return { data: null, error: error.message };
    }

    return { data: [data as StaffRoomAssignment], error: null };
  } catch (error) {
    console.error('Error in createRoomAssignment:', error);
    return { data: null, error: 'Failed to create room assignment' };
  }
}

// Delete field assignment
export async function deleteFieldAssignment(assignmentId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('staff_field_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting field assignment:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteFieldAssignment:', error);
    return { error: 'Failed to delete field assignment' };
  }
}

// Delete room assignment
export async function deleteRoomAssignment(assignmentId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('staff_room_assignments')
      .delete()
      .eq('id', assignmentId);

    if (error) {
      console.error('Error deleting room assignment:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteRoomAssignment:', error);
    return { error: 'Failed to delete room assignment' };
  }
}

// Get available users for assignment
export async function getAvailableUsers(): Promise<{ data: AssignmentUser[] | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .in('role', ['staff', 'manager', 'coordinator'])
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return { data: null, error: error.message };
    }

    return { data: data as AssignmentUser[], error: null };
  } catch (error) {
    console.error('Error in getAvailableUsers:', error);
    return { data: null, error: 'Failed to fetch users' };
  }
}

// Get available fields for assignment
export async function getAvailableFields(): Promise<{ data: AssignmentField[] | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('fields')
      .select(`
        id,
        name,
        type,
        facility_id,
        facilities (
          name
        )
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching fields:', error);
      return { data: null, error: error.message };
    }

    const fields = data?.map((field: any) => ({
      id: field.id,
      name: field.name,
      type: field.type,
      facility_id: field.facility_id,
      facility_name: field.facilities.name
    })) || [];

    return { data: fields as AssignmentField[], error: null };
  } catch (error) {
    console.error('Error in getAvailableFields:', error);
    return { data: null, error: 'Failed to fetch fields' };
  }
}

// Get available rooms for assignment
export async function getAvailableRooms(): Promise<{ data: AssignmentRoom[] | null; error: string | null }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('rooms')
      .select(`
        id,
        number,
        type,
        building_id,
        buildings (
          name,
          facility_id,
          facilities (
            name
          )
        )
      `)
      .order('number', { ascending: true });

    if (error) {
      console.error('Error fetching rooms:', error);
      return { data: null, error: error.message };
    }

    const rooms = data?.map((room: any) => ({
      id: room.id,
      number: room.number,
      type: room.type,
      building_id: room.building_id,
      building_name: room.buildings.name,
      facility_id: room.buildings.facility_id,
      facility_name: room.buildings.facilities.name
    })) || [];

    return { data: rooms as AssignmentRoom[], error: null };
  } catch (error) {
    console.error('Error in getAvailableRooms:', error);
    return { data: null, error: 'Failed to fetch rooms' };
  }
} 