import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

if (!apiKey.startsWith('SG.')) {
  throw new Error('Invalid SendGrid API key format. API key should start with "SG."');
}

sgMail.setApiKey(apiKey);

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