import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getServiceRoleClient } from '@/lib/supabase/server';

// GET - Fetch consent records
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const phoneNumber = searchParams.get('phone');
    
    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    let query = supabase
      .from('sms_consent_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (phoneNumber) {
      query = query.eq('phone_number', phoneNumber);
    }

    const { data: consent, error: consentError } = await query.single();

    if (consentError && consentError.code !== 'PGRST116') {
      throw consentError;
    }

    // Get history if consent exists
    let history = [];
    if (consent) {
      const { data: historyData } = await supabase
        .from('sms_consent_history')
        .select('*')
        .eq('phone_number', consent.phone_number)
        .order('created_at', { ascending: false })
        .limit(10);
      
      history = historyData || [];
    }

    return NextResponse.json({
      success: true,
      consent,
      history
    });
  } catch (error) {
    console.error('Error fetching consent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent records' },
      { status: 500 }
    );
  }
}

// POST - Create new consent record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      phone_number,
      full_name,
      email,
      user_id,
      consent_source,
      message_types,
      consent_text,
      page_url
    } = body;

    // Validate required fields
    if (!phone_number || !consent_text || !page_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check for existing active consent
    const { data: existing } = await supabase
      .from('sms_consent_records')
      .select('id')
      .eq('phone_number', phone_number)
      .eq('consent_status', 'active')
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Active consent already exists for this phone number' },
        { status: 400 }
      );
    }

    // Create consent record
    const { data: consent, error } = await supabase
      .from('sms_consent_records')
      .insert({
        phone_number: phone_number.replace(/\D/g, ''),
        full_name,
        email,
        user_id,
        consent_source: consent_source || 'website_form',
        message_types: message_types || ['all'],
        consent_text,
        page_url,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent'),
        referrer_url: request.headers.get('referer'),
        terms_version: '1.0',
        privacy_policy_version: '1.0',
        verification_token: Math.random().toString(36).substring(2, 15),
        verification_sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating consent:', error);
      throw error;
    }

    // Send verification SMS (if Twilio is configured)
    if (process.env.TWILIO_ACCOUNT_SID) {
      try {
        const { sendSMS } = await import('@/lib/sms');
        await sendSMS(
          phone_number,
          `FacilityCore: Reply YES to confirm SMS notifications. Reply STOP to cancel. Msg & data rates may apply.`,
          'verification'
        );
      } catch (smsError) {
        console.error('Error sending verification SMS:', smsError);
        // Don't fail the consent creation if SMS fails
      }
    }

    // Log the action
    await supabase
      .from('sms_consent_history')
      .insert({
        consent_record_id: consent.id,
        phone_number: consent.phone_number,
        action: 'opt_in',
        new_status: 'active',
        source: 'web_form',
        details: { page_url, message_types },
        ip_address: request.headers.get('x-forwarded-for'),
        user_agent: request.headers.get('user-agent')
      });

    return NextResponse.json({
      success: true,
      consent,
      message: 'Consent recorded successfully. Check your phone for verification.'
    });
  } catch (error) {
    console.error('Error creating consent:', error);
    return NextResponse.json(
      { error: 'Failed to create consent record' },
      { status: 500 }
    );
  }
}
