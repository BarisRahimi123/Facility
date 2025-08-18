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
  const startTime = Date.now();
  
  try {
    console.log('📧 sendUserInvitation server action started at:', new Date().toISOString());
    console.log('📧 Request data:', {
      email: invitationData.email,
      role: invitationData.role,
      metadata: invitationData.metadata
    });

    // Add timeout protection
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Server action timeout after 10 seconds')), 10000);
    });

    const invitationPromise = (async () => {
      console.log('🔧 Creating Supabase clients...');
      const supabase = await createServerSupabaseClient();
      const serviceClient = getServiceRoleClient();
      console.log('✅ Supabase clients created');
      
      // Get current user
      console.log('👤 Getting current user...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Auth error in sendUserInvitation:', authError);
        return { success: false, error: 'Not authenticated' };
      }

      console.log(`👤 User authenticated: ${user.email}`);

      // Use the service role client to call the RPC function
      console.log('📡 Calling send_user_invitation RPC...');
      const rpcData = {
        p_email: invitationData.email,
        p_role: invitationData.role,
        p_invited_by: user.id,
        p_facility_id: invitationData.facility_id,
        p_organization_id: invitationData.organization_id,
        p_metadata: invitationData.metadata || {}
      };
      console.log('📡 RPC parameters:', rpcData);

      const { data, error } = await serviceClient.rpc('send_user_invitation', rpcData);

      if (error) {
        console.error('❌ RPC call failed:', error);
        console.error('❌ RPC error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { success: false, error: error.message };
      }

      console.log('✅ Invitation sent successfully:', data);
      return { success: true, data };
    })();

    const result = await Promise.race([invitationPromise, timeoutPromise]);
    
    const endTime = Date.now();
    console.log(`⏱️ Server action completed in ${endTime - startTime}ms`);
    
    return result;

  } catch (error) {
    const endTime = Date.now();
    console.error(`❌ Error in sendUserInvitation server action after ${endTime - startTime}ms:`, error);
    
    if (error instanceof Error && error.message.includes('timeout')) {
      return { 
        success: false, 
        error: 'Request timed out. Please try again.' 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
