import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';

let emailSettings = {
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL,
  fromName: 'FacilityCore',
  replyTo: '',
  defaultTemplate: '',
};

const supabase = getServiceRoleClient();

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      settings: {
        ...emailSettings,
        apiKey: '••••••••',
      },
    });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const requiredFields = ['apiKey', 'fromEmail', 'fromName'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.fromEmail)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid from email format' 
        },
        { status: 400 }
      );
    }

    if (data.replyTo && !emailRegex.test(data.replyTo)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid reply-to email format' 
        },
        { status: 400 }
      );
    }

    if (!data.apiKey.startsWith('SG.')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid SendGrid API key format' 
        },
        { status: 400 }
      );
    }

    emailSettings = {
      ...emailSettings,
      ...data,
    };

    try {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Email Settings Updated',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Email Settings Updated</h1>
            <p>Your email settings have been updated successfully.</p>
            <p>From: ${data.fromEmail}</p>
            <p>From Name: ${data.fromName}</p>
            ${data.replyTo ? `<p>Reply-To: ${data.replyTo}</p>` : ''}
          </div>
        `,
        from: data.fromEmail,
        fromName: data.fromName,
        replyTo: data.replyTo,
      });
    } catch (error) {
      console.error('Error testing new email configuration:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to verify new email configuration' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Email settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    return NextResponse.json(
      { error: 'Failed to update email settings' },
      { status: 500 }
    );
  }
}
