import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone_number } = body;

    if (!phone_number) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Find active consent record
    const { data: consent, error: fetchError } = await supabase
      .from('sms_consent_records')
      .select('id')
      .eq('phone_number', phone_number.replace(/\D/g, ''))
      .eq('consent_status', 'active')
      .single();

    if (fetchError || !consent) {
      return NextResponse.json(
        { error: 'No active consent found for this phone number' },
        { status: 404 }
      );
    }

    // Update consent status to revoked
    const { error: updateError } = await supabase
      .from('sms_consent_records')
      .update({
        consent_status: 'revoked',
        revoked_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', consent.id);

    if (updateError) {
      throw updateError;
    }

    // Log the opt-out action
    await supabase
      .from('sms_consent_history')
      .insert({
        consent_record_id: consent.id,
        phone_number: phone_number.replace(/\D/g, ''),
        action: 'opt_out',
        previous_status: 'active',
        new_status: 'revoked',
        source: 'web_form',
        ip_address: request.headers.get('x-forwarded-for'),
        user_agent: request.headers.get('user-agent')
      });

    // Send confirmation SMS (if Twilio is configured)
    if (process.env.TWILIO_ACCOUNT_SID) {
      try {
        const { sendSMS } = await import('@/lib/sms');
        await sendSMS(
          phone_number,
          `FacilityCore: You have been unsubscribed from SMS notifications. Reply START to resubscribe.`,
          'transactional'
        );
      } catch (smsError) {
        console.error('Error sending opt-out confirmation:', smsError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from SMS notifications'
    });
  } catch (error) {
    console.error('Error processing opt-out:', error);
    return NextResponse.json(
      { error: 'Failed to process opt-out request' },
      { status: 500 }
    );
  }
}
