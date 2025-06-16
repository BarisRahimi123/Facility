import { NextResponse } from 'next/server';
import twilio from 'twilio';

interface TwilioError extends Error {
  code: number;
  moreInfo?: string;
  status?: number;
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  console.log('Formatting phone number:', { input: phone, cleaned });
  
  // For US numbers (10 digits), add +1
  if (cleaned.length === 10) {
    const formatted = '+1' + cleaned;
    console.log('Formatted 10-digit number:', formatted);
    return formatted;
  }
  
  // If already has country code (11 digits starting with 1)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const formatted = '+' + cleaned;
    console.log('Formatted 11-digit number:', formatted);
    return formatted;
  }
  
  // Default case: just ensure it starts with +1
  const formatted = cleaned.startsWith('1') ? '+' + cleaned : '+1' + cleaned;
  console.log('Default formatting:', formatted);
  return formatted;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    if (!body.to) {
      console.log('Missing "to" number in request body');
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const formattedPhone = formatPhoneNumber(body.to);
    console.log('Phone number formatting:', {
      original: body.to,
      formatted: formattedPhone
    });

    const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
    const authToken = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;

    console.log('Twilio configuration:', {
      accountSid: accountSid ? `${accountSid.slice(0, 4)}...${accountSid.slice(-4)}` : 'Not set',
      authToken: authToken ? '****' : 'Not set',
      fromNumber: fromNumber || 'Not set'
    });

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Missing Twilio configuration');
      return NextResponse.json(
        { error: 'Twilio configuration is incomplete' },
        { status: 500 }
      );
    }

    console.log('Initializing Twilio client...');
    const client = twilio(accountSid, authToken);

    console.log('Sending test SMS...');
    const message = await client.messages.create({
      body: 'This is a test SMS from your application. If you received this message, your SMS settings are configured correctly!',
      from: fromNumber,
      to: '+15128396700' // Using the provided number with country code
    });

    console.log('SMS sent successfully:', {
      messageId: message.sid,
      status: message.status,
      direction: message.direction,
      from: message.from,
      to: message.to
    });

    return NextResponse.json({
      success: true,
      message: 'Test SMS sent successfully',
      details: {
        messageId: message.sid,
        status: message.status,
        to: formattedPhone
      }
    });
  } catch (error) {
    console.error('Error sending test SMS:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown error type'
    });

    // Check for specific Twilio error codes
    if (error instanceof Error && 'code' in error) {
      const twilioError = error as TwilioError;
      return NextResponse.json(
        {
          success: false,
          error: 'Twilio error',
          code: twilioError.code,
          message: twilioError.message,
          moreInfo: twilioError.moreInfo
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test SMS',
        details: error instanceof Error ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
} 