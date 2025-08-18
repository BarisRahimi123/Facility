import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 API: Invitation request received');
    
    const body = await request.json();
    console.log('📧 API: Request body:', {
      email: body.email,
      role: body.role,
      hasMetadata: !!body.metadata
    });

    const supabase = await createServerSupabaseClient();
    const serviceClient = getServiceRoleClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ API: Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log(`👤 API: User authenticated: ${user.email}`);

    // Use the service role client to call the RPC function
    console.log('📡 API: Calling send_user_invitation RPC...');
    const { data, error } = await serviceClient.rpc('send_user_invitation', {
      p_email: body.email,
      p_role: body.role,
      p_invited_by: user.id,
      p_facility_id: body.facility_id,
      p_organization_id: body.organization_id,
      p_metadata: body.metadata || {}
    });

    if (error) {
      console.error('❌ API: RPC call failed:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log('✅ API: Invitation sent successfully');
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('❌ API: Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
