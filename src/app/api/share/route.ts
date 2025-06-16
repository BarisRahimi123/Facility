import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { formatPhoneNumber } from '@/utils/phone';
import { sendEmail } from '@/lib/email';

interface ShareRequest {
  recipients: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }>;
  reportUrl: string;
  reportTitle: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as ShareRequest;
    console.log('Share request:', body);

    const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID;
    const authToken = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Missing Twilio configuration');
      return NextResponse.json(
        { error: 'Twilio configuration is incomplete' },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);
    const results = [];

    // Process each recipient
    for (const recipient of body.recipients) {
      // Send SMS if phone number is provided
      if (recipient.phone) {
        try {
          const formattedPhone = formatPhoneNumber(recipient.phone);
          const message = await client.messages.create({
            body: `${recipient.name}, you have been shared a maintenance report: ${body.reportTitle}\n\nView it here: ${body.reportUrl}`,
            from: fromNumber,
            to: formattedPhone
          });
          results.push({
            type: 'sms',
            recipient: recipient.phone,
            success: true,
            messageId: message.sid
          });
        } catch (error) {
          console.error('Error sending SMS:', error);
          results.push({
            type: 'sms',
            recipient: recipient.phone,
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send SMS'
          });
        }
      }

      // Send email if email address is provided
      if (recipient.email) {
        try {
          const emailResult = await sendEmail({
            to: recipient.email,
            subject: body.reportTitle,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #2563eb; padding: 20px; text-align: center;">
                  <h1 style="color: white; margin: 0;">FacilityCore</h1>
                </div>
                
                <div style="padding: 20px;">
                  <h2 style="color: #2563eb;">Shared Report</h2>
                  
                  <p>Hello ${recipient.name},</p>
                  
                  <p>A maintenance report has been shared with you.</p>
                  
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${body.reportTitle}</h3>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${body.reportUrl}" style="
                      background-color: #2563eb;
                      color: white;
                      padding: 12px 24px;
                      text-decoration: none;
                      border-radius: 6px;
                      display: inline-block;
                    ">
                      View Report
                    </a>
                  </div>
                  
                  <p style="color: #6b7280; font-size: 14px;">
                    If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
                    <a href="${body.reportUrl}" style="color: #2563eb;">${body.reportUrl}</a>
                  </p>
                </div>
                
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin-top: 30px;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    This is an automated message from FacilityCore. Please do not reply to this email.
                  </p>
                </div>
              </div>
            `,
          });

          results.push({
            type: 'email',
            recipient: recipient.email,
            success: true,
            messageId: emailResult.messageId
          });
        } catch (error) {
          console.error('Error sending email:', error);
          results.push({
            type: 'email',
            recipient: recipient.email,
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error processing share request:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process share request'
      },
      { status: 500 }
    );
  }
} 