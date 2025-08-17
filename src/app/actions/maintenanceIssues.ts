'use server';

import { createServerSupabaseClient, getServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendIssueReportNotification } from './notifications';

// Types
export interface MaintenanceQRCode {
  id: string;
  code: string;
  facility_id: string;
  building_id?: string;
  room_id?: string;
  field_id?: string;
  location_type: 'facility' | 'building' | 'room' | 'field';
  location_name: string;
  location_details?: string;
  qr_url: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface IssueReport {
  id: string;
  facility_id: string;
  building_id?: string;
  room_id?: string;
  field_id?: string;
  qr_code_id?: string;
  title: string;
  description: string;
  category: 'electrical' | 'plumbing' | 'hvac' | 'structural' | 'safety' | 
            'cleaning' | 'pest_control' | 'landscaping' | 'equipment' | 
            'security' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reported_by?: string;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  location_type: string;
  location_name: string;
  location_details?: string;
  images?: string[];
  attachments?: string[];
  status: 'pending' | 'acknowledged' | 'assigned' | 'in_progress' | 
          'on_hold' | 'resolved' | 'closed' | 'cancelled';
  task_id?: string;
  created_at: string;
  acknowledged_at?: string;
  assigned_at?: string;
  resolved_at?: string;
  closed_at?: string;
  metadata?: any;
  notes?: string;
  resolution_notes?: string;
}

export interface CreateIssueReportData {
  facility_id: string;
  building_id?: string;
  room_id?: string;
  field_id?: string;
  qr_code_id?: string;
  title: string;
  description: string;
  category: IssueReport['category'];
  priority: IssueReport['priority'];
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  location_type: string;
  location_name: string;
  location_details?: string;
  images?: string[];
  attachments?: string[];
}

export interface CreateQRCodeData {
  facility_id: string;
  building_id?: string;
  room_id?: string;
  field_id?: string;
  location_type: 'facility' | 'building' | 'room' | 'field';
  location_name: string;
  location_details?: string;
}

// Generate a unique QR code
export async function generateQRCode(data: CreateQRCodeData) {
  try {
    const authClient = createServerSupabaseClient();
    const { data: user } = await authClient.auth.getUser();
    
    if (!user?.user) {
      return { error: 'User not authenticated' };
    }

    const serviceRoleClient = getServiceRoleClient();

    // Call the generate_qr_code function to get a unique code
    const { data: codeResult, error: codeError } = await serviceRoleClient
      .rpc('generate_qr_code');

    if (codeError) {
      console.error('Error generating QR code:', codeError);
      return { error: 'Failed to generate QR code' };
    }

    const code = codeResult;
    
    // Generate the QR URL (this will be the URL that the QR code points to)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qr_url = `${baseUrl}/report-issue?code=${code}`;

    // Insert the QR code record
    const { data: qrCode, error } = await serviceRoleClient
      .from('maintenance_qr_codes')
      .insert({
        code,
        facility_id: data.facility_id,
        building_id: data.building_id || null,
        room_id: data.room_id || null,
        field_id: data.field_id || null,
        location_type: data.location_type,
        location_name: data.location_name,
        location_details: data.location_details || null,
        qr_url,
        created_by: user.user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating QR code:', error);
      return { error: 'Failed to create QR code' };
    }

    revalidatePath('/maintenance');
    return { data: qrCode };
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Get QR codes for a facility
export async function getQRCodes(facilityId: string) {
  try {
    const serviceRoleClient = getServiceRoleClient();

    const { data, error } = await serviceRoleClient
      .from('maintenance_qr_codes')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching QR codes:', error);
      return { error: 'Failed to fetch QR codes' };
    }

    return { data };
  } catch (error) {
    console.error('Failed to fetch QR codes:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Get QR code by code
export async function getQRCodeByCode(code: string) {
  try {
    const serviceRoleClient = getServiceRoleClient();

    const { data, error } = await serviceRoleClient
      .from('maintenance_qr_codes')
      .select(`
        *,
        facilities!facility_id (name),
        buildings!building_id (name),
        rooms!room_id (name),
        fields!field_id (name)
      `)
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching QR code:', error);
      return { error: 'QR code not found' };
    }

    return { data };
  } catch (error) {
    console.error('Failed to fetch QR code:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Create an issue report
export async function createIssueReport(data: CreateIssueReportData) {
  try {
    const authClient = createServerSupabaseClient();
    const { data: user } = await authClient.auth.getUser();
    
    const serviceRoleClient = getServiceRoleClient();

    // Create the issue report
    const { data: issue, error } = await serviceRoleClient
      .from('maintenance_issue_reports')
      .insert({
        ...data,
        reported_by: user?.user?.id || null,
        status: 'pending',
        images: data.images || [],
        attachments: data.attachments || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating issue report:', error);
      return { error: 'Failed to create issue report' };
    }

    // Log the creation activity
    if (user?.user) {
      await serviceRoleClient.rpc('log_issue_activity', {
        p_issue_id: issue.id,
        p_user_id: user.user.id,
        p_action: 'created',
        p_description: 'Issue report created'
      });
    }

    // Send SMS notification to facility managers
    await sendIssueReportNotification({
      facilityId: data.facility_id,
      buildingId: data.building_id,
      roomId: data.room_id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      reportedBy: {
        name: data.reporter_name || 'Anonymous',
        email: data.reporter_email || '',
        phone: data.reporter_phone
      }
    });

    revalidatePath('/maintenance');
    return { data: issue };
  } catch (error) {
    console.error('Failed to create issue report:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Get issue reports for a facility
export async function getIssueReports(facilityId: string) {
  try {
    const serviceRoleClient = getServiceRoleClient();

    const { data, error } = await serviceRoleClient
      .from('maintenance_issue_reports')
      .select(`
        *,
        buildings!building_id (name),
        rooms!room_id (name),
        fields!field_id (name),
        maintenance_tasks!task_id (
          id,
          title,
          status,
          assigned_to
        )
      `)
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching issue reports:', error);
      return { error: 'Failed to fetch issue reports' };
    }

    return { data };
  } catch (error) {
    console.error('Failed to fetch issue reports:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Update issue report status
export async function updateIssueStatus(
  issueId: string, 
  status: IssueReport['status'],
  notes?: string
) {
  try {
    const authClient = createServerSupabaseClient();
    const { data: user } = await authClient.auth.getUser();
    
    if (!user?.user) {
      return { error: 'User not authenticated' };
    }

    const serviceRoleClient = getServiceRoleClient();

    // Get current issue
    const { data: currentIssue } = await serviceRoleClient
      .from('maintenance_issue_reports')
      .select('status')
      .eq('id', issueId)
      .single();

    // Update the issue
    const updateData: any = { status };
    
    // Set timestamp based on status
    if (status === 'acknowledged') updateData.acknowledged_at = new Date().toISOString();
    if (status === 'assigned') updateData.assigned_at = new Date().toISOString();
    if (status === 'resolved') updateData.resolved_at = new Date().toISOString();
    if (status === 'closed') updateData.closed_at = new Date().toISOString();
    if (notes) updateData.notes = notes;

    const { data: issue, error } = await serviceRoleClient
      .from('maintenance_issue_reports')
      .update(updateData)
      .eq('id', issueId)
      .select()
      .single();

    if (error) {
      console.error('Error updating issue status:', error);
      return { error: 'Failed to update issue status' };
    }

    // Log the activity
    await serviceRoleClient.rpc('log_issue_activity', {
      p_issue_id: issueId,
      p_user_id: user.user.id,
      p_action: 'status_changed',
      p_description: `Status changed from ${currentIssue?.status} to ${status}`,
      p_old_value: { status: currentIssue?.status },
      p_new_value: { status }
    });

    revalidatePath('/maintenance');
    return { data: issue };
  } catch (error) {
    console.error('Failed to update issue status:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Convert issue to maintenance task
export async function convertIssueToTask(issueId: string, assignedTo?: string) {
  try {
    const authClient = createServerSupabaseClient();
    const { data: user } = await authClient.auth.getUser();
    
    if (!user?.user) {
      return { error: 'User not authenticated' };
    }

    const serviceRoleClient = getServiceRoleClient();

    // Call the convert_issue_to_task function
    const { data: taskId, error } = await serviceRoleClient
      .rpc('convert_issue_to_task', {
        p_issue_id: issueId,
        p_assigned_to: assignedTo || null,
        p_user_id: user.user.id
      });

    if (error) {
      console.error('Error converting issue to task:', error);
      return { error: 'Failed to convert issue to task' };
    }

    revalidatePath('/maintenance');
    return { data: { taskId } };
  } catch (error) {
    console.error('Failed to convert issue to task:', error);
    return { error: 'An unexpected error occurred' };
  }
}

// Delete QR code
export async function deleteQRCode(qrCodeId: string) {
  try {
    const authClient = createServerSupabaseClient();
    const { data: user } = await authClient.auth.getUser();
    
    if (!user?.user) {
      return { error: 'User not authenticated' };
    }

    const serviceRoleClient = getServiceRoleClient();

    // Soft delete by setting is_active to false
    const { error } = await serviceRoleClient
      .from('maintenance_qr_codes')
      .update({ is_active: false })
      .eq('id', qrCodeId);

    if (error) {
      console.error('Error deleting QR code:', error);
      return { error: 'Failed to delete QR code' };
    }

    revalidatePath('/maintenance');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete QR code:', error);
    return { error: 'An unexpected error occurred' };
  }
}





