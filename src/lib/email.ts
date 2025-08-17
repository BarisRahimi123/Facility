import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key (if available)
const apiKey = process.env.SENDGRID_API_KEY;
let sendGridConfigured = false;

if (apiKey) {
  if (!apiKey.startsWith('SG.')) {
    console.warn('⚠️ Invalid SendGrid API key format. API key should start with "SG."');
  } else {
    sgMail.setApiKey(apiKey);
    sendGridConfigured = true;
    console.log('✅ SendGrid configured successfully');
  }
} else {
  console.log('📧 SendGrid not configured - emails will be logged to console');
}

const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'info@facilitycore.ai';
const DEFAULT_FROM_NAME = 'FacilityCore';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  text?: string;
  replyTo?: string;
}

export async function sendEmail({ 
  to, 
  subject, 
  html, 
  text, 
  from = DEFAULT_FROM_EMAIL,
  fromName = DEFAULT_FROM_NAME,
  replyTo 
}: EmailOptions) {
  try {
    // If SendGrid is not configured, log email to console
    if (!sendGridConfigured) {
      console.log('📧 EMAIL (SendGrid not configured):');
      console.log('================================');
      console.log(`To: ${to}`);
      console.log(`From: ${fromName} <${from}>`);
      console.log(`Subject: ${subject}`);
      console.log(`Text: ${text || html.replace(/<[^>]*>/g, '').substring(0, 200)}...`);
      console.log('================================\n');
      
      return { 
        success: true, 
        warning: 'Email logged to console - SendGrid not configured' 
      };
    }

    const msg = {
      to,
      from: {
        email: from,
        name: fromName,
      },
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      replyTo: replyTo || from,
    };

    console.log('Sending email with configuration:', {
      to,
      from: msg.from,
      subject,
      replyTo: msg.replyTo,
    });

    const [response] = await sgMail.send(msg);
    
    console.log('Email sent successfully:', {
      statusCode: response?.statusCode,
      headers: response?.headers,
      messageId: response?.headers['x-message-id'],
    });

    return { 
      success: true, 
      messageId: response?.headers['x-message-id'],
      statusCode: response?.statusCode 
    };
  } catch (error) {
    console.error('Error sending email:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown error type',
      to,
      from,
      subject,
    });

    throw new Error(JSON.stringify({
      message: 'Failed to send email',
      details: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: error.stack,
      } : error,
    }));
  }
}

export function generateContractorFormEmail(data: {
  contractorName: string;
  taskTitle: string;
  taskDescription: string;
  formUrl: string;
  systemType?: string;
  location?: string;
  dueDate?: string;
}) {
  const { 
    contractorName, 
    taskTitle, 
    taskDescription, 
    formUrl, 
    systemType, 
    location,
    dueDate 
  } = data;
  
  const emailText = `
    New Maintenance Request from FacilityCore
    
    Hello ${contractorName},
    
    You have received a new maintenance request that requires your attention.
    
    Task: ${taskTitle}
    Description: ${taskDescription}
    ${systemType ? `System Type: ${systemType}` : ''}
    ${location ? `Location: ${location}` : ''}
    ${dueDate ? `Due Date: ${dueDate}` : ''}
    
    Please submit your estimate at: ${formUrl}
    
    This is an automated message from FacilityCore. Please do not reply to this email.
  `;
  
  return {
    subject: `New Maintenance Request: ${taskTitle}`,
    text: emailText,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">FacilityCore</h1>
        </div>
        
        <div style="padding: 20px;">
          <h2 style="color: #2563eb;">New Maintenance Request</h2>
          
          <p>Hello ${contractorName},</p>
          
          <p>You have received a new maintenance request that requires your attention.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${taskTitle}</h3>
            <p style="color: #4b5563;">${taskDescription}</p>
            
            ${systemType ? `<p><strong>System Type:</strong> ${systemType}</p>` : ''}
            ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
            ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
          </div>
          
          <p>Please click the button below to submit your estimate:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${formUrl}" style="
              background-color: #2563eb;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              display: inline-block;
            ">
              Submit Estimate
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you're having trouble clicking the button, copy and paste this URL into your browser:<br>
            <a href="${formUrl}" style="color: #2563eb;">${formUrl}</a>
          </p>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin-top: 30px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            This is an automated message from FacilityCore. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };
}

// Email service for sending invitations
export async function sendInvitationEmail(invitationData: {
  id: string;
  token: string;
  email: string;
  role: string;
  expires_at: string;
  invitedByName?: string;
  organizationName?: string;
}) {
  try {
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/accept-invitation?token=${invitationData.token}`;
    const expiresDate = new Date(invitationData.expires_at);
    const roleDisplay = invitationData.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #007aff 0%, #0051cc 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Facilitycore</h1>
        </div>
        
        <!-- Content -->
        <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">You're Invited!</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            ${invitationData.invitedByName ? `${invitationData.invitedByName} has` : 'You have been'} invited you to join 
            ${invitationData.organizationName ? `<strong>${invitationData.organizationName}</strong> on` : ''} 
            Facilitycore as a <strong>${roleDisplay}</strong>.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Facilitycore is a comprehensive facility management platform that helps organizations efficiently manage their facilities, maintenance, and operations.
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${inviteUrl}" style="
              background: linear-gradient(135deg, #007aff 0%, #0051cc 100%);
              color: white;
              padding: 14px 32px;
              text-decoration: none;
              border-radius: 6px;
              display: inline-block;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 4px 6px rgba(0, 122, 255, 0.2);
            ">
              Accept Invitation
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
            If you're having trouble clicking the button, copy and paste this URL into your browser:
          </p>
          <p style="color: #007aff; font-size: 14px; word-break: break-all; margin: 10px 0;">
            ${inviteUrl}
          </p>
          
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin-top: 30px;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>⏰ This invitation expires on ${expiresDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</strong>
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
            Need help? Contact us at support@facilitycore.com
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Facilitycore. All rights reserved.
          </p>
        </div>
      </div>
    `;
    
    // Send the email using SendGrid
    const result = await sendEmail({
      to: invitationData.email,
      subject: `You're invited to join Facilitycore as a ${roleDisplay}`,
      html: emailHtml,
      text: `You're invited to join Facilitycore as a ${roleDisplay}. Accept your invitation at: ${inviteUrl}. This invitation expires on ${expiresDate.toLocaleDateString()}.`
    });
    
    return result;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
} 