'use server';

import { createServerSupabaseClient, getServiceRoleClient } from '@/lib/supabase/server';

interface SendInvitationData {
  email: string;
  role: string;
  invited_by?: string;
  facility_id?: string | null;
  organization_id?: string | null;
  metadata?: any;
}

interface InvitationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function sendUserInvitation(invitationData: SendInvitationData): Promise<InvitationResponse> {
  try {
    console.log('📧 sendUserInvitation server action called with:', {
      email: invitationData.email,
      role: invitationData.role,
      metadata: invitationData.metadata
    });

    const supabase = await createServerSupabaseClient();
    const serviceClient = getServiceRoleClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Auth error in sendUserInvitation:', authError);
      return { success: false, error: 'Not authenticated' };
    }

    console.log(`👤 User authenticated: ${user.email}`);

    // Use the service role client to call the RPC function
    const { data, error } = await serviceClient.rpc('send_user_invitation', {
      p_email: invitationData.email,
      p_role: invitationData.role,
      p_invited_by: user.id,
      p_facility_id: invitationData.facility_id,
      p_organization_id: invitationData.organization_id,
      p_metadata: invitationData.metadata || {}
    });

    if (error) {
      console.error('❌ RPC call failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Invitation sent successfully:', data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Error in sendUserInvitation server action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
