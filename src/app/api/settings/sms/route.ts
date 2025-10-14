import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';

// In a real application, these settings would be stored encrypted in a database
// For now, we'll use in-memory storage and environment variables as fallback
let storedSmsSettings: {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  enabled: boolean;
} | null = null;

// Get SMS settings from environment or stored values
function getSmsSettings() {
  if (storedSmsSettings) {
    return storedSmsSettings;
  }
  
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    enabled: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
  };
}

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

    const settings = getSmsSettings();
    
    // In a real application, fetch settings from database
    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        authToken: settings.authToken ? '••••••••' : '', // Don't send actual auth token
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

    // If SMS is being disabled, skip validation
    if (settings.enabled === false) {
      storedSmsSettings = {
        accountSid: settings.accountSid || '',
        authToken: settings.authToken || '',
        phoneNumber: settings.phoneNumber || '',
        enabled: false,
      };
      
      return NextResponse.json({ 
        success: true,
        message: 'SMS notifications disabled' 
      });
    }

    // Validate required fields only when enabling
    const requiredFields = ['accountSid', 'authToken', 'phoneNumber'];
    const missingFields = requiredFields.filter(field => !settings[field] || settings[field].trim() === '');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}. Please fill in all Twilio credentials.` 
        },
        { status: 400 }
      );
    }

    // Validate Account SID format (should start with AC and be 34 chars)
    const accountSid = settings.accountSid.trim();
    if (!accountSid.startsWith('AC') || accountSid.length !== 34) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid Twilio Account SID. It should start with "AC" and be 34 characters long. You can find it in your Twilio Console Dashboard.' 
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneNumber = settings.phoneNumber.trim();
    if (!phoneNumber.startsWith('+')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Phone number must include country code with + prefix (e.g., +14155552671 for US numbers)' 
        },
        { status: 400 }
      );
    }

    // In a real application, save settings to database with encryption
    // For now, store in memory (will be lost on server restart)
    storedSmsSettings = {
      accountSid: accountSid,
      authToken: settings.authToken.trim(),
      phoneNumber: phoneNumber,
      enabled: settings.enabled !== undefined ? settings.enabled : true,
    };
    
    // Update environment variables for the current process
    // (This won't persist, but allows immediate testing)
    process.env.TWILIO_ACCOUNT_SID = accountSid;
    process.env.TWILIO_AUTH_TOKEN = settings.authToken.trim();
    process.env.TWILIO_PHONE_NUMBER = phoneNumber;

    return NextResponse.json({ 
      success: true,
      message: 'SMS settings updated successfully. Note: Settings are stored temporarily and will need to be re-entered after server restart.' 
    });
  } catch (error) {
    console.error('Error updating SMS settings:', error);
    return NextResponse.json(
      { error: 'Failed to update SMS settings' },
      { status: 500 }
    );
  }
} 