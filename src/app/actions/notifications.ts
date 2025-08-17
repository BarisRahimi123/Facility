'use server';

import { getServiceRoleClient } from '@/lib/supabase/server';
import { sendSMS, sendBatchSMS } from '@/lib/sms';
import { format, addDays, isToday, isTomorrow, isPast } from 'date-fns';

// Send due date reminders for maintenance tasks
export async function sendDueDateReminders() {
  const supabase = getServiceRoleClient();
  
  try {
    // Get all active maintenance tasks with due dates
    const { data: tasks, error } = await supabase
      .from('maintenance_tasks')
      .select(`
        *,
        facility:facilities(name),
        task_assignments!inner(
          user:users!task_assignments_user_id_fkey(
            id,
            name,
            email,
            phone
          )
        )
      `)
      .in('status', ['pending', 'in_progress'])
      .not('due_date', 'is', null);

    if (error) throw error;
    if (!tasks || tasks.length === 0) return { success: true, message: 'No tasks to remind' };

    const notifications = [];
    
    for (const task of tasks) {
      const dueDate = new Date(task.due_date);
      const facilityName = task.facility?.name || 'Unknown Facility';
      
      // Check due date status
      let notificationType = null;
      if (isPast(dueDate) && !isToday(dueDate)) {
        notificationType = 'task_overdue';
      } else if (isToday(dueDate)) {
        notificationType = 'task_due_today';
      } else if (isTomorrow(dueDate)) {
        notificationType = 'task_due_tomorrow';
      }
      
      if (notificationType) {
        // Send notifications to all assigned users
        for (const assignment of task.task_assignments) {
          if (assignment.user?.phone) {
            notifications.push({
              phone: assignment.user.phone,
              type: notificationType,
              variables: {
                taskTitle: task.title,
                facilityName,
                dueDate: format(dueDate, 'MMM dd, yyyy')
              }
            });
          }
        }
      }
    }
    
    // Send all notifications
    if (notifications.length > 0) {
      const results = [];
      for (const notification of notifications) {
        const result = await sendSMS(
          notification.phone,
          notification.type as any,
          notification.variables
        );
        results.push(result);
      }
      
      return {
        success: true,
        message: `Sent ${results.filter(r => r.success).length} reminder notifications`
      };
    }
    
    return { success: true, message: 'No reminders needed' };
  } catch (error) {
    console.error('Error sending due date reminders:', error);
    return { success: false, error: 'Failed to send reminders' };
  }
}

// Send reservation notifications
export async function sendReservationNotification(
  reservationId: string,
  type: 'requested' | 'approved' | 'rejected' | 'reminder'
) {
  const supabase = getServiceRoleClient();
  
  try {
    // Get reservation details
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select(`
        *,
        field:fields(name),
        facility:facilities(name),
        user:users(name, email, phone)
      `)
      .eq('id', reservationId)
      .single();

    if (error) throw error;
    if (!reservation) throw new Error('Reservation not found');

    const fieldName = reservation.field?.name || 'Unknown Field';
    const facilityName = reservation.facility?.name || 'Unknown Facility';
    
    let recipients = [];
    let notificationType = null;
    let variables = {
      fieldName,
      facilityName,
      date: format(new Date(reservation.date), 'MMM dd, yyyy'),
      time: reservation.start_time,
      confirmationNumber: reservation.confirmation_number || reservationId.substring(0, 8).toUpperCase()
    };

    switch (type) {
      case 'requested':
        // Notify facility managers
        const { data: managers } = await supabase
          .from('users')
          .select('name, phone')
          .eq('organization_id', reservation.organization_id)
          .in('user_role', ['master_admin', 'sub_admin', 'site_approver']);
        
        if (managers) {
          recipients = managers.filter(m => m.phone);
          notificationType = 'reservation_requested';
          variables = {
            ...variables,
            requesterName: reservation.user?.name || 'Unknown'
          };
        }
        break;
      
      case 'approved':
      case 'rejected':
        // Notify the requester
        if (reservation.user?.phone) {
          recipients = [reservation.user];
          notificationType = type === 'approved' ? 'reservation_approved' : 'reservation_rejected';
          if (type === 'rejected') {
            variables = {
              ...variables,
              reason: 'Schedule conflict' // You can customize this
            };
          }
        }
        break;
      
      case 'reminder':
        // Notify the requester
        if (reservation.user?.phone) {
          recipients = [reservation.user];
          notificationType = 'reservation_reminder';
        }
        break;
    }
    
    // Send notifications
    if (recipients.length > 0 && notificationType) {
      const results = [];
      for (const recipient of recipients) {
        const result = await sendSMS(
          recipient.phone,
          notificationType as any,
          variables
        );
        results.push(result);
      }
      
      return {
        success: true,
        message: `Sent ${results.filter(r => r.success).length} notifications`
      };
    }
    
    return { success: true, message: 'No notifications sent' };
  } catch (error) {
    console.error('Error sending reservation notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

// Send issue report notification
export async function sendIssueReportNotification(issueData: {
  facilityId: string;
  buildingId?: string;
  roomId?: string;
  title: string;
  description: string;
  priority: string;
  reportedBy: {
    name: string;
    email: string;
    phone?: string;
  };
}) {
  const supabase = getServiceRoleClient();
  
  try {
    // Get facility and building names
    const { data: facility } = await supabase
      .from('facilities')
      .select('name')
      .eq('id', issueData.facilityId)
      .single();
    
    let buildingName = '';
    if (issueData.buildingId) {
      const { data: building } = await supabase
        .from('buildings')
        .select('name')
        .eq('id', issueData.buildingId)
        .single();
      buildingName = building?.name || '';
    }
    
    // Get facility managers to notify
    const { data: managers } = await supabase
      .from('staff_facility_assignments')
      .select(`
        user:users!staff_facility_assignments_user_id_fkey(
          id,
          name,
          phone,
          email
        )
      `)
      .eq('facility_id', issueData.facilityId)
      .eq('manage_maintenance', true);
    
    if (managers && managers.length > 0) {
      const recipients = managers
        .filter(m => m.user?.phone)
        .map(m => ({
          phone: m.user.phone,
          variables: {
            facilityName: facility?.name || 'Unknown Facility',
            buildingName,
            issueTitle: issueData.title,
            priority: issueData.priority,
            link: `${process.env.NEXT_PUBLIC_APP_URL}/maintenance`
          }
        }));
      
      if (recipients.length > 0) {
        const results = await sendBatchSMS(
          recipients,
          'issue_submitted',
          {}
        );
        
        return {
          success: true,
          message: `Notified ${results.filter(r => r.success).length} managers`
        };
      }
    }
    
    return { success: true, message: 'No managers to notify' };
  } catch (error) {
    console.error('Error sending issue report notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

// Send maintenance scheduled notification
export async function sendMaintenanceScheduledNotification(
  facilityId: string,
  buildingId: string | null,
  maintenanceType: string,
  date: Date,
  duration: string
) {
  const supabase = getServiceRoleClient();
  
  try {
    // Get facility and building names
    const { data: facility } = await supabase
      .from('facilities')
      .select('name')
      .eq('id', facilityId)
      .single();
    
    let buildingName = '';
    if (buildingId) {
      const { data: building } = await supabase
        .from('buildings')
        .select('name')
        .eq('id', buildingId)
        .single();
      buildingName = building?.name || '';
    }
    
    // Get all users associated with the facility
    const { data: users } = await supabase
      .from('staff_facility_assignments')
      .select(`
        user:users!staff_facility_assignments_user_id_fkey(
          id,
          name,
          phone,
          email,
          notification_preferences
        )
      `)
      .eq('facility_id', facilityId);
    
    if (users && users.length > 0) {
      const recipients = users
        .filter(u => u.user?.phone && u.user?.notification_preferences?.sms_enabled !== false)
        .map(u => ({
          phone: u.user.phone,
          variables: {
            facilityName: facility?.name || 'Unknown Facility',
            buildingName,
            date: format(date, 'MMM dd, yyyy'),
            maintenanceType,
            duration
          }
        }));
      
      if (recipients.length > 0) {
        const results = await sendBatchSMS(
          recipients,
          'maintenance_scheduled',
          {}
        );
        
        return {
          success: true,
          message: `Notified ${results.filter(r => r.success).length} users`
        };
      }
    }
    
    return { success: true, message: 'No users to notify' };
  } catch (error) {
    console.error('Error sending maintenance scheduled notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

