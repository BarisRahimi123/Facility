import { NextRequest, NextResponse } from 'next/server';
import { Twilio } from 'twilio';
import { getTwilioConfig } from '@/services/settings';

export async function POST(request: NextRequest) {
  try {
    const { to, body } = await request.json();

    if (!to || !body) {
      return NextResponse.json(
        { error: 'Phone number and message body are required' },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be in E.164 format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    // Get Twilio config and create client
    const config = await getTwilioConfig();
    const client = new Twilio(config.accountSid, config.authToken);

    // Send message
    const message = await client.messages.create({
      body,
      from: config.phoneNumber,
      to,
    });

    return NextResponse.json({
      success: true,
      messageId: message.sid,
    });
  } catch (error: any) {
    console.error('SMS sending error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
} 