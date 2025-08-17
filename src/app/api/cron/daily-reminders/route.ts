import { NextRequest, NextResponse } from 'next/server';
import { sendDueDateReminders } from '@/app/actions/notifications';

// This endpoint can be called by a cron job to send daily reminders
// You can set up a cron job using services like:
// - Vercel Cron Jobs
// - GitHub Actions
// - External cron services (cron-job.org, EasyCron, etc.)
// - Supabase Edge Functions with pg_cron

export async function GET(request: NextRequest) {
  try {
    // Optionally, add authentication to ensure only authorized services can trigger this
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔔 Running daily reminder notifications...');
    
    // Send due date reminders
    const result = await sendDueDateReminders();
    
    console.log('✅ Daily reminders completed:', result);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error: any) {
    console.error('❌ Error in daily reminders cron:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send daily reminders' },
      { status: 500 }
    );
  }
}

// POST endpoint for manual trigger
export async function POST(request: NextRequest) {
  return GET(request);
}

