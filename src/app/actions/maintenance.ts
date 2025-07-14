'use server';

import { createServerSupabaseClient, getServiceRoleClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { MaintenanceTask } from '@/types/maintenance';

export interface CreateMaintenanceTaskData {
  title: string;
  description: string;
  type: 'corrective' | 'preventive' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  facilityId: string;
  buildingId?: string;
  roomId?: string;
  location?: string;
  systemType?: string;
  issueType?: string;
  impact?: 'low' | 'medium' | 'high';
  severity?: 'low' | 'medium' | 'high';
  startDate?: string;
  dueDate?: string;
  estimatedDuration?: number;
  notes?: string;
  assignmentType?: 'internal' | 'external';
  assignedTo?: string; // User ID for internal assignment
  externalAssignments?: Array<{
    email: string;
    phone?: string;
    company_name?: string;
    role: 'contractor' | 'vendor' | 'consultant';
  }>;
  internalAssignments?: Array<{
    userId: string;
    role: 'assignee' | 'observer' | 'approver';
  }>;
}

export async function createMaintenanceTask(data: CreateMaintenanceTaskData) {
  const authClient = await createServerSupabaseClient();
  const supabase = getServiceRoleClient();

  // Get the current user
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    throw new Error('User organization not found');
  }

  try {
    // Create the maintenance task
    const { data: task, error: taskError } = await supabase
      .from('maintenance_tasks')
      .insert({
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        facility_id: data.facilityId,
        building_id: data.buildingId,
        room_id: data.roomId,
        organization_id: userData.organization_id,
        location: data.location,
        system_type: data.systemType,
        issue_type: data.issueType,
        impact: data.impact,
        severity: data.severity,
        start_date: data.startDate,
        due_date: data.dueDate,
        estimated_duration: data.estimatedDuration,
        notes: data.notes,
        assignment_type: data.assignmentType,
        assigned_to: data.assignedTo,
        created_by: user.id,
        updated_by: user.id,
        status: 'new',
        workflow_status: 'new'
      })
      .select()
      .single();

    if (taskError) throw taskError;

    // Handle internal assignments
    if (data.internalAssignments && data.internalAssignments.length > 0) {
      const assignments = data.internalAssignments.map(assignment => ({
        task_id: task.id,
        user_id: assignment.userId,
        role: assignment.role,
        assigned_by: user.id
      }));

      const { error: assignmentError } = await supabase
        .from('task_assignments')
        .insert(assignments);

      if (assignmentError) throw assignmentError;

      // Log activity
      await supabase.rpc('log_task_activity', {
        p_task_id: task.id,
        p_user_id: user.id,
        p_action: 'assigned_staff',
        p_details: { assignments: data.internalAssignments }
      });
    }

    // Handle external contractor invitations
    if (data.externalAssignments && data.externalAssignments.length > 0) {
      const invitations = await Promise.all(
        data.externalAssignments.map(async (external) => {
          const { data: tokenData } = await supabase.rpc('generate_invitation_token');
          
          return {
            task_id: task.id,
            email: external.email,
            phone: external.phone,
            company_name: external.company_name,
            role: external.role,
            token: tokenData,
            invited_by: user.id
          };
        })
      );

      const { error: invitationError } = await supabase
        .from('task_contractor_invitations')
        .insert(invitations);

      if (invitationError) throw invitationError;

      // Log activity
      await supabase.rpc('log_task_activity', {
        p_task_id: task.id,
        p_user_id: user.id,
        p_action: 'invited_contractors',
        p_details: { invitations: data.externalAssignments }
      });

      // TODO: Send invitation emails to contractors
      // This would integrate with your email service
    }

    revalidatePath('/maintenance');
    return { success: true, taskId: task.id };
  } catch (error) {
    console.error('Error creating maintenance task:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create task' 
    };
  }
}

export async function getMaintenanceTasks(facilityId?: string) {
  const authClient = await createServerSupabaseClient();
  const supabase = getServiceRoleClient();

  // Get the current user
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user's role and organization
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!userData) {
    throw new Error('User data not found');
  }

  try {
    let query = supabase
      .from('maintenance_tasks')
      .select(`
        *,
        facility:facilities(name),
        building:buildings(name),
        room:rooms(room_number),
        created_by_user:users!maintenance_tasks_created_by_fkey(name, email),
        assigned_user:users!maintenance_tasks_assigned_to_fkey(name, email),
        task_assignments(
          id,
          user_id,
          role,
          user:users(name, email)
        ),
        task_contractor_invitations(
          id,
          email,
          company_name,
          role,
          status
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by facility if provided
    if (facilityId) {
      query = query.eq('facility_id', facilityId);
    }

    // Filter by organization unless user is master admin
    if (!['master_admin', 'district_approver'].includes(userData.role)) {
      query = query.eq('organization_id', userData.organization_id);
    }

    const { data: tasks, error } = await query;

    if (error) throw error;

    return tasks || [];
  } catch (error) {
    console.error('Error fetching maintenance tasks:', error);
    return [];
  }
}

export async function updateMaintenanceTask(taskId: string, updates: Partial<MaintenanceTask>) {
  const authClient = await createServerSupabaseClient();
  const supabase = getServiceRoleClient();

  // Get the current user
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const { error } = await supabase
      .from('maintenance_tasks')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;

    // Log activity
    await supabase.rpc('log_task_activity', {
      p_task_id: taskId,
      p_user_id: user.id,
      p_action: 'updated_task',
      p_details: { updates }
    });

    revalidatePath('/maintenance');
    return { success: true };
  } catch (error) {
    console.error('Error updating maintenance task:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update task' 
    };
  }
}

export async function assignTaskToStaff(taskId: string, assignments: Array<{
  userId: string;
  role: 'assignee' | 'observer' | 'approver';
}>) {
  const authClient = await createServerSupabaseClient();
  const supabase = getServiceRoleClient();

  // Get the current user
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Insert new assignments
    const assignmentData = assignments.map(assignment => ({
      task_id: taskId,
      user_id: assignment.userId,
      role: assignment.role,
      assigned_by: user.id
    }));

    const { error } = await supabase
      .from('task_assignments')
      .insert(assignmentData);

    if (error) throw error;

    // Update task assignment type if needed
    await supabase
      .from('maintenance_tasks')
      .update({ 
        assignment_type: 'internal',
        updated_by: user.id 
      })
      .eq('id', taskId);

    // Log activity
    await supabase.rpc('log_task_activity', {
      p_task_id: taskId,
      p_user_id: user.id,
      p_action: 'assigned_staff',
      p_details: { assignments }
    });

    revalidatePath('/maintenance');
    return { success: true };
  } catch (error) {
    console.error('Error assigning task to staff:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to assign task' 
    };
  }
}

export async function inviteContractorToTask(taskId: string, contractors: Array<{
  email: string;
  phone?: string;
  company_name?: string;
  role: 'contractor' | 'vendor' | 'consultant';
}>) {
  const authClient = await createServerSupabaseClient();
  const supabase = getServiceRoleClient();

  // Get the current user
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Generate invitations with tokens
    const invitations = await Promise.all(
      contractors.map(async (contractor) => {
        const { data: tokenData } = await supabase.rpc('generate_invitation_token');
        
        return {
          task_id: taskId,
          email: contractor.email,
          phone: contractor.phone,
          company_name: contractor.company_name,
          role: contractor.role,
          token: tokenData,
          invited_by: user.id
        };
      })
    );

    const { error } = await supabase
      .from('task_contractor_invitations')
      .insert(invitations);

    if (error) throw error;

    // Update task assignment type if needed
    await supabase
      .from('maintenance_tasks')
      .update({ 
        assignment_type: 'external',
        updated_by: user.id 
      })
      .eq('id', taskId);

    // Log activity
    await supabase.rpc('log_task_activity', {
      p_task_id: taskId,
      p_user_id: user.id,
      p_action: 'invited_contractors',
      p_details: { invitations: contractors }
    });

    // TODO: Send invitation emails

    revalidatePath('/maintenance');
    return { success: true, invitations };
  } catch (error) {
    console.error('Error inviting contractors:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to invite contractors' 
    };
  }
}

export async function getAvailableStaff(organizationId?: string) {
  const authClient = await createServerSupabaseClient();
  const supabase = getServiceRoleClient();

  // Get the current user
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user's role and organization
  const { data: userData } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!userData) {
    throw new Error('User data not found');
  }

  try {
    let query = supabase
      .from('users')
      .select('id, name, email, role')
      .neq('role', 'renter'); // Exclude renters

    // Filter by organization unless user is master admin
    if (!['master_admin', 'district_approver'].includes(userData.role)) {
      query = query.eq('organization_id', organizationId || userData.organization_id);
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: staff, error } = await query;

    if (error) throw error;

    return staff || [];
  } catch (error) {
    console.error('Error fetching available staff:', error);
    return [];
  }
}

export async function getVendors() {
  const authClient = await createServerSupabaseClient();
  const supabase = getServiceRoleClient();

  // Get the current user
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    throw new Error('User organization not found');
  }

  try {
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .eq('is_approved', true)
      .order('name');

    if (error) throw error;

    return vendors || [];
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return [];
  }
} 