import { sendEmail } from './email';
import { sendSMS } from './twilio';
import { Reservation, Field } from '@/types/field';

interface NotificationContext {
  reservation: Reservation;
  field: Field;
  facilityName: string;
  adminEmails?: string[];
  adminPhones?: string[];
}

// Email Templates
const createReservationSubmittedEmailTemplate = (context: NotificationContext) => {
  const { reservation, field, facilityName } = context;
  
  return {
    subject: `Reservation Submitted - ${field.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Reservation Submitted</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Thank you for your reservation request</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Reservation Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; margin-top: 0;">📍 Facility & Field</h3>
            <p><strong>Facility:</strong> ${facilityName}</p>
            <p><strong>Field:</strong> ${field.name}</p>
            <p><strong>Field Type:</strong> ${field.type}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; margin-top: 0;">📅 Date & Time</h3>
            <p><strong>Date:</strong> ${new Date(reservation.start_time).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(reservation.start_time).toLocaleTimeString()} - ${new Date(reservation.end_time).toLocaleTimeString()}</p>
            <p><strong>Duration:</strong> ${Math.ceil((new Date(reservation.end_time).getTime() - new Date(reservation.start_time).getTime()) / (1000 * 60 * 60))} hours</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; margin-top: 0;">👤 Contact Information</h3>
            <p><strong>Name:</strong> ${reservation.renter_name}</p>
            <p><strong>Email:</strong> ${reservation.renter_email}</p>
            <p><strong>Phone:</strong> ${reservation.renter_phone || 'Not provided'}</p>
            ${reservation.organization_name ? `<p><strong>Organization:</strong> ${reservation.organization_name}</p>` : ''}
            <p><strong>Purpose:</strong> ${reservation.purpose_of_use}</p>
            <p><strong>Attendees:</strong> ${reservation.estimated_attendees || 'Not specified'}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; margin-top: 0;">💰 Pricing</h3>
            <p><strong>Total Amount:</strong> $${reservation.total_amount}</p>
            <p><strong>Deposit Required:</strong> $${reservation.deposit_amount}</p>
            <p><strong>Payment Status:</strong> ${reservation.payment_status}</p>
          </div>
          
          <div style="background: ${reservation.approval_required ? '#fff3cd' : '#d4edda'}; padding: 20px; border-radius: 8px; border-left: 4px solid ${reservation.approval_required ? '#ffc107' : '#28a745'};">
            <h3 style="color: ${reservation.approval_required ? '#856404' : '#155724'}; margin-top: 0;">
              ${reservation.approval_required ? '⏳ Approval Required' : '✅ Auto-Approved'}
            </h3>
            <p style="color: ${reservation.approval_required ? '#856404' : '#155724'}; margin: 0;">
              ${reservation.approval_required 
                ? 'Your reservation is pending approval. You will receive an email notification once it has been reviewed by our team.' 
                : 'Your reservation has been automatically approved! Payment instructions will follow shortly.'
              }
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666;">Questions? Contact us at <a href="mailto:support@facilitycore.com" style="color: #667eea;">support@facilitycore.com</a></p>
          </div>
        </div>
        
        <div style="background: #343a40; padding: 20px; text-align: center;">
          <p style="color: #adb5bd; margin: 0; font-size: 14px;">© 2024 FacilityCore. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
Reservation Submitted - ${field.name}

Thank you for your reservation request.

Reservation Details:
- Facility: ${facilityName}
- Field: ${field.name}
- Date: ${new Date(reservation.start_time).toLocaleDateString()}
- Time: ${new Date(reservation.start_time).toLocaleTimeString()} - ${new Date(reservation.end_time).toLocaleTimeString()}
- Contact: ${reservation.renter_name} (${reservation.renter_email})
- Total: $${reservation.total_amount}

Status: ${reservation.approval_required ? 'Pending Approval' : 'Auto-Approved'}

Questions? Contact us at support@facilitycore.com
    `
  };
};

const createReservationApprovedEmailTemplate = (context: NotificationContext) => {
  const { reservation, field, facilityName } = context;
  
  return {
    subject: `🎉 Reservation Approved - ${field.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Reservation Approved!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Your reservation has been confirmed</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin-bottom: 20px;">
            <h2 style="color: #155724; margin-top: 0;">✅ Reservation Confirmed</h2>
            <p style="color: #155724; margin: 0; font-size: 16px;">
              Great news! Your reservation for <strong>${field.name}</strong> has been approved and confirmed.
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #28a745; margin-top: 0;">📅 Confirmed Details</h3>
            <p><strong>Facility:</strong> ${facilityName}</p>
            <p><strong>Field:</strong> ${field.name}</p>
            <p><strong>Date:</strong> ${new Date(reservation.start_time).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(reservation.start_time).toLocaleTimeString()} - ${new Date(reservation.end_time).toLocaleTimeString()}</p>
            <p><strong>Reservation ID:</strong> ${reservation.id}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #28a745; margin-top: 0;">💳 Payment Information</h3>
            <p><strong>Total Amount:</strong> $${reservation.total_amount}</p>
            <p><strong>Deposit Required:</strong> $${reservation.deposit_amount}</p>
            <p><strong>Balance Due:</strong> $${reservation.total_amount - reservation.deposit_amount}</p>
            <p style="color: #856404;"><strong>Payment Due:</strong> Before your reservation date</p>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
            <h3 style="color: #856404; margin-top: 0;">📋 Next Steps</h3>
            <ol style="color: #856404; margin: 0; padding-left: 20px;">
              <li>Complete your payment using the link provided separately</li>
              <li>Review the facility rules and guidelines</li>
              <li>Arrive 15 minutes before your scheduled time</li>
              <li>Bring a valid ID and emergency contact information</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:support@facilitycore.com" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Contact Support</a>
          </div>
        </div>
        
        <div style="background: #343a40; padding: 20px; text-align: center;">
          <p style="color: #adb5bd; margin: 0; font-size: 14px;">© 2024 FacilityCore. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
🎉 Reservation Approved - ${field.name}

Your reservation has been confirmed!

Confirmed Details:
- Facility: ${facilityName}
- Field: ${field.name}
- Date: ${new Date(reservation.start_time).toLocaleDateString()}
- Time: ${new Date(reservation.start_time).toLocaleTimeString()} - ${new Date(reservation.end_time).toLocaleTimeString()}
- Reservation ID: ${reservation.id}

Payment Information:
- Total: $${reservation.total_amount}
- Deposit: $${reservation.deposit_amount}
- Balance Due: $${reservation.total_amount - reservation.deposit_amount}

Next Steps:
1. Complete payment before your reservation date
2. Review facility rules and guidelines
3. Arrive 15 minutes early with valid ID

Questions? Contact support@facilitycore.com
    `
  };
};

const createAdminNotificationEmailTemplate = (context: NotificationContext) => {
  const { reservation, field, facilityName } = context;
  
  return {
    subject: `🔔 New Reservation Requires Approval - ${field.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔔 New Reservation</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Requires your approval</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
            <h2 style="color: #856404; margin-top: 0;">⏳ Pending Approval</h2>
            <p style="color: #856404; margin: 0;">
              A new reservation request requires your review and approval.
            </p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #ffc107; margin-top: 0;">📍 Reservation Details</h3>
            <p><strong>Facility:</strong> ${facilityName}</p>
            <p><strong>Field:</strong> ${field.name}</p>
            <p><strong>Date:</strong> ${new Date(reservation.start_time).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date(reservation.start_time).toLocaleTimeString()} - ${new Date(reservation.end_time).toLocaleTimeString()}</p>
            <p><strong>Total Value:</strong> $${reservation.total_amount}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: #ffc107; margin-top: 0;">👤 Customer Information</h3>
            <p><strong>Name:</strong> ${reservation.renter_name}</p>
            <p><strong>Email:</strong> ${reservation.renter_email}</p>
            <p><strong>Phone:</strong> ${reservation.renter_phone || 'Not provided'}</p>
            ${reservation.organization_name ? `<p><strong>Organization:</strong> ${reservation.organization_name}</p>` : ''}
            <p><strong>Purpose:</strong> ${reservation.purpose_of_use}</p>
            <p><strong>Attendees:</strong> ${reservation.estimated_attendees || 'Not specified'}</p>
            ${reservation.special_requests ? `<p><strong>Special Requests:</strong> ${reservation.special_requests}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/reservations?id=${reservation.id}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-right: 10px;">✅ Review & Approve</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/reservations" style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">📋 View All</a>
          </div>
        </div>
        
        <div style="background: #343a40; padding: 20px; text-align: center;">
          <p style="color: #adb5bd; margin: 0; font-size: 14px;">© 2024 FacilityCore. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
🔔 New Reservation Requires Approval - ${field.name}

A new reservation request requires your review.

Details:
- Facility: ${facilityName}
- Field: ${field.name}
- Date: ${new Date(reservation.start_time).toLocaleDateString()}
- Time: ${new Date(reservation.start_time).toLocaleTimeString()} - ${new Date(reservation.end_time).toLocaleTimeString()}
- Customer: ${reservation.renter_name} (${reservation.renter_email})
- Value: $${reservation.total_amount}

Review at: ${process.env.NEXT_PUBLIC_APP_URL}/admin/reservations?id=${reservation.id}
    `
  };
};

// SMS Templates
const createReservationSubmittedSMS = (context: NotificationContext) => {
  const { reservation, field } = context;
  return `🏟️ Reservation submitted for ${field.name} on ${new Date(reservation.start_time).toLocaleDateString()}. ${reservation.approval_required ? 'Pending approval - you\'ll be notified once reviewed.' : 'Auto-approved! Payment details coming soon.'} Ref: ${reservation.id.slice(0, 8)}`;
};

const createReservationApprovedSMS = (context: NotificationContext) => {
  const { reservation, field } = context;
  return `🎉 APPROVED! Your reservation for ${field.name} on ${new Date(reservation.start_time).toLocaleDateString()} is confirmed. Total: $${reservation.total_amount}. Payment link sent separately. Ref: ${reservation.id.slice(0, 8)}`;
};

const createAdminNotificationSMS = (context: NotificationContext) => {
  const { reservation, field } = context;
  return `🔔 New reservation pending approval: ${field.name}, ${new Date(reservation.start_time).toLocaleDateString()}, $${reservation.total_amount} by ${reservation.renter_name}. Review: ${process.env.NEXT_PUBLIC_APP_URL}/admin/reservations`;
};

// Main notification functions
export async function sendReservationSubmittedNotifications(context: NotificationContext) {
  const emailTemplate = createReservationSubmittedEmailTemplate(context);
  const smsMessage = createReservationSubmittedSMS(context);
  
  const notifications = [];
  
  // Send email to customer
  try {
    await sendEmail({
      to: context.reservation.renter_email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    });
    notifications.push({ type: 'email', to: context.reservation.renter_email, status: 'sent' });
  } catch (error) {
    console.error('Failed to send reservation submitted email:', error);
    notifications.push({ type: 'email', to: context.reservation.renter_email, status: 'failed', error });
  }
  
  // Send SMS to customer (if phone provided)
  if (context.reservation.renter_phone) {
    try {
      await sendSMS(context.reservation.renter_phone, smsMessage);
      notifications.push({ type: 'sms', to: context.reservation.renter_phone, status: 'sent' });
    } catch (error) {
      console.error('Failed to send reservation submitted SMS:', error);
      notifications.push({ type: 'sms', to: context.reservation.renter_phone, status: 'failed', error });
    }
  }
  
  // Send admin notifications if approval required
  if (context.reservation.approval_required) {
    await sendAdminNotifications(context);
  }
  
  return notifications;
}

export async function sendReservationApprovedNotifications(context: NotificationContext) {
  const emailTemplate = createReservationApprovedEmailTemplate(context);
  const smsMessage = createReservationApprovedSMS(context);
  
  const notifications = [];
  
  // Send email to customer
  try {
    await sendEmail({
      to: context.reservation.renter_email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    });
    notifications.push({ type: 'email', to: context.reservation.renter_email, status: 'sent' });
  } catch (error) {
    console.error('Failed to send reservation approved email:', error);
    notifications.push({ type: 'email', to: context.reservation.renter_email, status: 'failed', error });
  }
  
  // Send SMS to customer (if phone provided)
  if (context.reservation.renter_phone) {
    try {
      await sendSMS(context.reservation.renter_phone, smsMessage);
      notifications.push({ type: 'sms', to: context.reservation.renter_phone, status: 'sent' });
    } catch (error) {
      console.error('Failed to send reservation approved SMS:', error);
      notifications.push({ type: 'sms', to: context.reservation.renter_phone, status: 'failed', error });
    }
  }
  
  return notifications;
}

export async function sendAdminNotifications(context: NotificationContext) {
  const emailTemplate = createAdminNotificationEmailTemplate(context);
  const smsMessage = createAdminNotificationSMS(context);
  
  const notifications = [];
  
  // Default admin contacts (should be configurable)
  const defaultAdminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@facilitycore.com'];
  const defaultAdminPhones = process.env.ADMIN_PHONES?.split(',') || [];
  
  const adminEmails = context.adminEmails || defaultAdminEmails;
  const adminPhones = context.adminPhones || defaultAdminPhones;
  
  // Send emails to admins
  for (const email of adminEmails) {
    try {
      await sendEmail({
        to: email.trim(),
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      });
      notifications.push({ type: 'email', to: email, status: 'sent' });
    } catch (error) {
      console.error(`Failed to send admin notification email to ${email}:`, error);
      notifications.push({ type: 'email', to: email, status: 'failed', error });
    }
  }
  
  // Send SMS to admins
  for (const phone of adminPhones) {
    try {
      await sendSMS(phone.trim(), smsMessage);
      notifications.push({ type: 'sms', to: phone, status: 'sent' });
    } catch (error) {
      console.error(`Failed to send admin notification SMS to ${phone}:`, error);
      notifications.push({ type: 'sms', to: phone, status: 'failed', error });
    }
  }
  
  return notifications;
} 