import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET() {
  try {
    // Send a test email using the verified sender email
    const result = await sendEmail({
      to: 'baris@plansrow.com',
      subject: 'Test Email from FacilityCore',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2563eb; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">FacilityCore</h1>
          </div>
          
          <div style="padding: 20px;">
            <h2 style="color: #2563eb;">Test Email</h2>
            
            <p>Hello,</p>
            
            <p>This is a test email to verify your email configuration.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Email Configuration</h3>
              <p><strong>From:</strong> ${process.env.SENDGRID_FROM_EMAIL}</p>
              <p><strong>To:</strong> baris@plansrow.com</p>
              <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            </div>
            
            <p>If you received this email, it means your email configuration is working correctly.</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              This is a test email from FacilityCore.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ 
      success: true, 
      result,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    console.error('Error sending test email:', error);

    let errorMessage = 'An unknown error occurred';
    let errorDetails = undefined;

    if (error instanceof Error) {
      try {
        const parsedError = JSON.parse(error.message);
        errorMessage = parsedError.message;
        errorDetails = parsedError.details;
      } catch {
        errorMessage = error.message;
        errorDetails = error.stack;
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send test email',
        message: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
} 