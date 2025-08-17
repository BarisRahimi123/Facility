import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getServiceRoleClient();
    
    // Get user's notification preferences
    const { data: userData, error } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    // Default preferences if none exist
    const defaultPreferences = {
      sms_enabled: true,
      email_enabled: true,
      sms_notifications: {
        issue_assigned: true,
        task_due_today: true,
        task_overdue: true,
        reservation_approved: true,
        reservation_rejected: true,
        maintenance_scheduled: true
      },
      email_notifications: {
        issue_assigned: true,
        task_due_tomorrow: true,
        task_due_today: true,
        task_overdue: true,
        reservation_requested: true,
        reservation_approved: true,
        reservation_rejected: true,
        maintenance_scheduled: true
      }
    };

    const preferences = userData?.notification_preferences || defaultPreferences;

    return NextResponse.json({ preferences });
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const preferences = await request.json();
    const supabase = getServiceRoleClient();

    // Update user's notification preferences
    const { error } = await supabase
      .from('users')
      .update({ notification_preferences: preferences })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Notification preferences updated' 
    });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

