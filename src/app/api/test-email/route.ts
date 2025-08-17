import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { to, type = 'test' } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    let emailContent;
    
    switch (type) {
      case 'welcome':
        emailContent = {
          subject: 'Welcome to Facilitycore!',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #007aff 0%, #0051cc 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">Welcome to Facilitycore!</h1>
              </div>
              <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb;">
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  Thank you for joining Facilitycore. We're excited to help you manage your facilities more efficiently.
                </p>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  This is a test email to verify that SendGrid integration is working correctly.
                </p>
              </div>
            </div>
          `
        };
        break;
        
      case 'test':
      default:
        emailContent = {
          subject: 'Test Email from Facilitycore',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #007aff 0%, #0051cc 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">SendGrid Test Email</h1>
              </div>
              <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb;">
                <h2 style="color: #1f2937;">Email Configuration Test</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  If you're receiving this email, your SendGrid integration is working correctly!
                </p>
                <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 15px; margin: 20px 0;">
                  <p style="color: #166534; margin: 0;">
                    ✅ SendGrid API Key is valid<br>
                    ✅ Email sending is functional<br>
                    ✅ HTML templates are rendering correctly
                  </p>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                  Sent at: ${new Date().toLocaleString()}
                </p>
              </div>
            </div>
          `
        };
    }

    const result = await sendEmail({
      to,
      ...emailContent
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      result
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SendGrid Test Endpoint',
    usage: 'POST to this endpoint with { "to": "email@example.com", "type": "test" | "welcome" }',
    sendGridConfigured: !!process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'not configured'
  });
}
