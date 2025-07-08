'use server';

import { createClient } from '@/lib/supabase/client';

export interface ShareRequest {
  facilityIds: string[]; // empty array means all facilities
  inviteeEmail: string;
  inviteeName: string;
  role: 'consultant' | 'vendor' | 'external';
  company: string;
  message: string;
  permissions: {
    viewPlans: boolean;
    viewTasks: boolean;
    viewDocuments: boolean;
    viewMaintenance: boolean;
    viewReports: boolean;
    addComments: boolean;
  };
  expiresAt?: Date;
}

export interface FacilityInvitation {
  id: string;
  facility_ids: string[]; // JSON array, empty means all facilities
  invitee_email: string;
  invitee_name: string;
  inviter_id: string;
  role: 'consultant' | 'vendor' | 'external';
  company?: string;
  message: string;
  permissions: {
    viewPlans: boolean;
    viewTasks: boolean;
    viewDocuments: boolean;
    viewMaintenance: boolean;
    viewReports: boolean;
    addComments: boolean;
  };
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Create service role client to bypass RLS
function getServiceRoleSupabase() {
  return createClient();
}

export async function createFacilityInvitation(shareRequest: ShareRequest): Promise<{ success: boolean; invitation?: FacilityInvitation; error?: string }> {
  try {
    const supabase = getServiceRoleSupabase();
    
    // Generate a unique token for the invitation
    const token = crypto.randomUUID().replace(/-/g, '');
    
    // Create invitation record
    const invitationData = {
      facility_ids: shareRequest.facilityIds,
      invitee_email: shareRequest.inviteeEmail,
      invitee_name: shareRequest.inviteeName,
      inviter_id: null, // Using null for mock user
      role: shareRequest.role,
      company: shareRequest.company || null,
      message: shareRequest.message,
      permissions: shareRequest.permissions,
      status: 'pending' as const,
      token: token,
      expires_at: shareRequest.expiresAt?.toISOString() || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days
    };

    const { data: invitation, error } = await supabase
      .from('facility_invitations')
      .insert(invitationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating facility invitation:', error);
      return { success: false, error: error.message };
    }

    // TODO: Send invitation email
    // For now, we'll just log the invitation details
    console.log('Facility invitation created:', {
      token: invitation.token,
      email: invitation.invitee_email,
      facilityIds: invitation.facility_ids,
      inviteUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/facility/${invitation.token}`
    });

    return { success: true, invitation };
  } catch (error) {
    console.error('Error in createFacilityInvitation:', error);
    return { success: false, error: 'Failed to create invitation' };
  }
}

export async function getFacilityInvitations(facilityId?: string): Promise<FacilityInvitation[]> {
  try {
    const supabase = getServiceRoleSupabase();
    
    let query = supabase
      .from('facility_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    // If facilityId is provided, filter invitations for that facility or all-facility invitations
    if (facilityId) {
      query = query.or(`facility_ids.cs.["${facilityId}"],facility_ids.eq.[]`);
    }

    const { data: invitations, error } = await query;

    if (error) {
      console.error('Error fetching facility invitations:', error);
      return [];
    }

    return invitations || [];
  } catch (error) {
    console.error('Error in getFacilityInvitations:', error);
    return [];
  }
}

export async function acceptFacilityInvitation(token: string, userEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServiceRoleSupabase();
    
    // Find the invitation by token
    const { data: invitation, error: fetchError } = await supabase
      .from('facility_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      return { success: false, error: 'Invalid or expired invitation' };
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('facility_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      
      return { success: false, error: 'Invitation has expired' };
    }

    // Check if email matches
    if (invitation.invitee_email !== userEmail) {
      return { success: false, error: 'Email address does not match invitation' };
    }

    // Update invitation status to accepted
    const { error: updateError } = await supabase
      .from('facility_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      return { success: false, error: 'Failed to accept invitation' };
    }

    // TODO: Create user account with appropriate permissions
    // For now, we'll just mark as accepted

    return { success: true };
  } catch (error) {
    console.error('Error in acceptFacilityInvitation:', error);
    return { success: false, error: 'Failed to accept invitation' };
  }
}

export async function revokeFacilityInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { error } = await supabase
      .from('facility_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId);

    if (error) {
      console.error('Error revoking facility invitation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in revokeFacilityInvitation:', error);
    return { success: false, error: 'Failed to revoke invitation' };
  }
}

export async function getInvitationByToken(token: string): Promise<{ invitation?: FacilityInvitation; error?: string }> {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data: invitation, error } = await supabase
      .from('facility_invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      console.error('Error fetching invitation by token:', error);
      return { error: 'Invitation not found' };
    }

    return { invitation };
  } catch (error) {
    console.error('Error in getInvitationByToken:', error);
    return { error: 'Failed to fetch invitation' };
  }
}    