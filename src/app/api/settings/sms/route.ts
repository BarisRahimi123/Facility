import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';

// In a real application, these settings would be stored in a database
let smsSettings = {
  accountSid: process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID,
  authToken: process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER,
  enabled: false,
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In a real application, fetch settings from database
    return NextResponse.json({
      success: true,
      settings: {
        ...smsSettings,
        authToken: '••••••••', // Don't send actual auth token
      },
    });
  } catch (error) {
    console.error('Error fetching SMS settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SMS settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { settings } = await request.json();

    // Validate required fields
    const requiredFields = ['accountSid', 'authToken', 'phoneNumber'];
    const missingFields = requiredFields.filter(field => !settings[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate Account SID format
    if (!settings.accountSid.startsWith('AC')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid Twilio Account SID format' 
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!settings.phoneNumber.startsWith('+')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Phone number must include country code (e.g., +1)' 
        },
        { status: 400 }
      );
    }

    // In a real application, save settings to database
    smsSettings = {
      ...smsSettings,
      ...settings,
    };

    return NextResponse.json({ 
      success: true,
      message: 'SMS settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating SMS settings:', error);
    return NextResponse.json(
      { error: 'Failed to update SMS settings' },
      { status: 500 }
    );
  }
} 