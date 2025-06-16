import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server-client';

// In a real application, these settings would be stored in a database
let notificationSettings = {
  maintenance: {
    enabled: true,
    urgentOnly: false,
    method: 'email',
  },
  tasks: {
    enabled: true,
    assignmentNotifications: true,
    statusUpdates: true,
    deadlineReminders: true,
    method: 'email',
  },
  system: {
    enabled: true,
    securityAlerts: true,
    maintenanceUpdates: true,
    method: 'email',
  },
  buildings: {
    enabled: true,
    issueReports: true,
    renovationUpdates: true,
    systemAlerts: true,
    method: 'email',
  },
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In a real application, fetch settings from database
    return NextResponse.json({
      success: true,
      preferences: notificationSettings,
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { preferences } = await request.json();

    // Validate required sections
    const requiredSections = ['maintenance', 'tasks', 'system', 'buildings'];
    const missingSections = requiredSections.filter(section => !preferences[section]);

    if (missingSections.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required sections: ${missingSections.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate notification methods
    const validMethods = ['email', 'sms', 'both'];
    const sections = Object.entries(preferences);
    for (const [section, settings] of sections) {
      if (!validMethods.includes((settings as any).method)) {
        return NextResponse.json(
          { 
            success: false,
            error: `Invalid notification method for ${section}` 
          },
          { status: 400 }
        );
      }
    }

    // In a real application, save settings to database
    notificationSettings = preferences;

    // Send test notification if settings changed
    if (preferences.system.enabled) {
      // In a real application, send a test notification using the new preferences
      console.log('Sending test notification with new preferences');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notification settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
} 