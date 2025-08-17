// Twilio SMS Service for Notifications
import twilio from 'twilio';

// Check if Twilio is configured
const twilioConfigured = !!(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER
);

// Initialize Twilio client if configured
const twilioClient = twilioConfigured
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Format phone number to E.164 format
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's a 10-digit US number, add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it's already 11 digits starting with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // If it already has country code
  if (cleaned.length > 10) {
    return `+${cleaned}`;
  }
  
  // Default: return with + prefix
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

// SMS notification types
export type SMSNotificationType = 
  | 'issue_submitted'
  | 'issue_assigned'
  | 'issue_resolved'
  | 'task_due_tomorrow'
  | 'task_due_today'
  | 'task_overdue'
  | 'reservation_requested'
  | 'reservation_approved'
  | 'reservation_rejected'
  | 'reservation_reminder'
  | 'maintenance_scheduled'
  | 'contractor_invited';

// SMS template interface
interface SMSTemplate {
  type: SMSNotificationType;
  to: string;
  variables: Record<string, any>;
}

// Generate SMS message based on type
function generateSMSMessage(type: SMSNotificationType, variables: Record<string, any>): string {
  switch (type) {
    case 'issue_submitted':
      return `🔧 New issue reported at ${variables.facilityName}${variables.buildingName ? ` - ${variables.buildingName}` : ''}: "${variables.issueTitle}". Priority: ${variables.priority || 'Normal'}. View details: ${variables.link || 'Log in to view'}`;
    
    case 'issue_assigned':
      return `📋 You've been assigned to an issue at ${variables.facilityName}: "${variables.issueTitle}". Due: ${variables.dueDate || 'ASAP'}. View details: ${variables.link || 'Log in to view'}`;
    
    case 'issue_resolved':
      return `✅ Issue resolved at ${variables.facilityName}: "${variables.issueTitle}" has been marked as complete by ${variables.resolvedBy}.`;
    
    case 'task_due_tomorrow':
      return `⏰ Reminder: Maintenance task "${variables.taskTitle}" at ${variables.facilityName} is due tomorrow (${variables.dueDate}). Please complete or reschedule.`;
    
    case 'task_due_today':
      return `🚨 URGENT: Maintenance task "${variables.taskTitle}" at ${variables.facilityName} is due TODAY! Please complete immediately or contact supervisor.`;
    
    case 'task_overdue':
      return `⚠️ OVERDUE: Maintenance task "${variables.taskTitle}" at ${variables.facilityName} was due on ${variables.dueDate}. Immediate action required!`;
    
    case 'reservation_requested':
      return `📅 New reservation request for ${variables.fieldName} at ${variables.facilityName} on ${variables.date} from ${variables.time}. Requester: ${variables.requesterName}. Review: ${variables.link || 'Log in to approve'}`;
    
    case 'reservation_approved':
      return `✅ Your reservation for ${variables.fieldName} at ${variables.facilityName} on ${variables.date} has been APPROVED! Confirmation #${variables.confirmationNumber}`;
    
    case 'reservation_rejected':
      return `❌ Your reservation for ${variables.fieldName} at ${variables.facilityName} on ${variables.date} was not approved. Reason: ${variables.reason || 'Schedule conflict'}. Please contact facility manager.`;
    
    case 'reservation_reminder':
      return `📅 Reminder: You have a reservation for ${variables.fieldName} at ${variables.facilityName} tomorrow (${variables.date}) at ${variables.time}. Don't forget!`;
    
    case 'maintenance_scheduled':
      return `🔧 Maintenance scheduled at ${variables.facilityName}${variables.buildingName ? ` - ${variables.buildingName}` : ''} on ${variables.date}. Type: ${variables.maintenanceType}. Duration: ${variables.duration || 'TBD'}`;
    
    case 'contractor_invited':
      return `💼 You've been invited to submit an estimate for maintenance work at ${variables.facilityName}. Task: "${variables.taskTitle}". Submit by: ${variables.deadline}. Link: ${variables.link}`;
    
    default:
      return `Notification from FacilityCore: ${variables.message || 'You have a new update'}`;
  }
}

// Enhanced SMS sending function with consent verification
export async function sendSMS(
  to: string,
  type: SMSNotificationType,
  variables: Record<string, any>,
  userId?: string
): Promise<{ success: boolean; message?: string; messageId?: string; error?: string; consentError?: boolean }> {
  const formattedPhone = formatPhoneNumber(to);
  const messageBody = generateSMSMessage(type, variables);
  let consentRecordId: string | undefined;
  let consentVerified = false;

  try {
    // Check consent if userId is provided
    if (userId) {
      try {
        // Import here to avoid circular dependencies
        const { checkSMSConsent, logSMSAttempt } = await import('@/app/actions/smsConsent');
        
        const consentCheck = await checkSMSConsent({
          userId,
          phoneNumber: formattedPhone
        });

        consentRecordId = consentCheck.consentRecordId;
        consentVerified = consentCheck.canSend;

        if (!consentCheck.canSend) {
          console.log(`🚫 SMS blocked - No consent: ${formattedPhone} (${consentCheck.reason})`);
          
          // Log the blocked attempt
          await logSMSAttempt({
            userId,
            phoneNumber: formattedPhone,
            messageType: type,
            messageContent: messageBody,
            consentRecordId,
            sendSuccessful: false,
            errorMessage: `Consent check failed: ${consentCheck.reason}`
          });

          return {
            success: false,
            consentError: true,
            error: `Cannot send SMS: ${consentCheck.reason}. User must grant SMS consent first.`
          };
        }

        console.log(`✅ SMS consent verified for ${formattedPhone}`);
      } catch (consentError) {
        console.error('Error checking SMS consent:', consentError);
        // Continue without consent check if there's an error
        console.warn('Proceeding with SMS send despite consent check error');
      }
    }

    // Check if Twilio is configured
    if (!twilioConfigured || !twilioClient) {
      console.log('📱 SMS notification (Twilio not configured):');
      console.log(`  To: ${formattedPhone}`);
      console.log(`  Type: ${type}`);
      console.log(`  Consent Verified: ${consentVerified}`);
      console.log(`  Message: ${messageBody}`);
      
      // Log the attempt even when Twilio is not configured
      if (userId) {
        try {
          const { logSMSAttempt } = await import('@/app/actions/smsConsent');
          await logSMSAttempt({
            userId,
            phoneNumber: formattedPhone,
            messageType: type,
            messageContent: messageBody,
            consentRecordId,
            sendSuccessful: false,
            errorMessage: 'Twilio not configured'
          });
        } catch (logError) {
          console.error('Error logging SMS attempt:', logError);
        }
      }

      return {
        success: false,
        error: 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
      };
    }

    // Send the SMS via Twilio
    const message = await twilioClient.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`✅ SMS sent successfully to ${formattedPhone} (${message.sid})`);
    
    // Log successful send
    if (userId) {
      try {
        const { logSMSAttempt } = await import('@/app/actions/smsConsent');
        await logSMSAttempt({
          userId,
          phoneNumber: formattedPhone,
          messageType: type,
          messageContent: messageBody,
          consentRecordId,
          sendSuccessful: true,
          twilioMessageSid: message.sid
        });
      } catch (logError) {
        console.error('Error logging SMS attempt:', logError);
      }
    }
    
    return {
      success: true,
      message: messageBody,
      messageId: message.sid
    };
  } catch (error: any) {
    console.error('❌ Error sending SMS:', error);
    
    // Log failed send
    if (userId) {
      try {
        const { logSMSAttempt } = await import('@/app/actions/smsConsent');
        await logSMSAttempt({
          userId,
          phoneNumber: formattedPhone,
          messageType: type,
          messageContent: messageBody,
          consentRecordId,
          sendSuccessful: false,
          errorMessage: error.message || 'Unknown error'
        });
      } catch (logError) {
        console.error('Error logging SMS attempt:', logError);
      }
    }
    
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
}

// Enhanced batch SMS sending with consent verification
export async function sendBatchSMS(
  recipients: Array<{ phone: string; userId?: string; variables?: Record<string, any> }>,
  type: SMSNotificationType,
  commonVariables: Record<string, any> = {}
): Promise<Array<{ phone: string; userId?: string; success: boolean; error?: string; consentError?: boolean }>> {
  const results = [];
  
  for (const recipient of recipients) {
    const variables = { ...commonVariables, ...recipient.variables };
    const result = await sendSMS(recipient.phone, type, variables, recipient.userId);
    results.push({
      phone: recipient.phone,
      userId: recipient.userId,
      success: result.success,
      error: result.error,
      consentError: result.consentError
    });
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Check if a phone number can receive SMS (basic validation)
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's at least 10 digits (US number without country code)
  // or up to 15 digits (international E.164 format max length)
  return cleaned.length >= 10 && cleaned.length <= 15;
}

// Get SMS notification preferences for a user
export async function getUserSMSPreferences(userId: string): Promise<{
  smsEnabled: boolean;
  notificationTypes: SMSNotificationType[];
}> {
  // This would typically fetch from database
  // For now, return default preferences
  return {
    smsEnabled: true,
    notificationTypes: [
      'issue_assigned',
      'task_due_today',
      'task_overdue',
      'reservation_approved',
      'reservation_rejected'
    ]
  };
}

// Send test SMS with optional consent verification
export async function sendTestSMS(to: string, userId?: string): Promise<{ success: boolean; error?: string; consentError?: boolean }> {
  return sendSMS(to, 'issue_submitted', {
    facilityName: 'Test Facility',
    buildingName: 'Building A',
    issueTitle: 'Test Issue - Please ignore',
    priority: 'Low',
    link: 'https://facilitycore.com/test'
  }, userId);
}

// Utility function to send SMS with user lookup
export async function sendSMSToUser(
  userId: string,
  type: SMSNotificationType,
  variables: Record<string, any>
): Promise<{ success: boolean; message?: string; messageId?: string; error?: string; consentError?: boolean }> {
  try {
    // Get user's phone number from database
    const { createServerSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createServerSupabaseClient();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('phone')
      .eq('id', userId)
      .single();

    if (error || !user?.phone) {
      return {
        success: false,
        error: 'User not found or no phone number on file'
      };
    }

    return sendSMS(user.phone, type, variables, userId);
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to send SMS to user'
    };
  }
}
