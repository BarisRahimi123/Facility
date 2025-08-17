import { NextRequest, NextResponse } from 'next/server';
import { sendTestSMS, formatPhoneNumber, isValidPhoneNumber } from '@/lib/sms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!isValidPhoneNumber(to)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(to);
    console.log('Sending test SMS to:', formattedPhone);

    const result = await sendTestSMS(to);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test SMS sent successfully',
        to: formattedPhone
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Failed to send test SMS',
          to: formattedPhone
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in test SMS endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const twilioConfigured = !!(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );

  return NextResponse.json({
    configured: twilioConfigured,
    fromNumber: twilioConfigured ? process.env.TWILIO_PHONE_NUMBER : null,
    message: twilioConfigured
      ? 'Twilio is configured. Send a POST request with { "to": "+1234567890" } to test SMS'
      : 'Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
  });
}

