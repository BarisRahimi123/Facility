import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create service role client for development
function getServiceRoleSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET() {
  try {
    const supabase = getServiceRoleSupabase();
    
    const { data, error } = await supabase
      .from('workflow_settings')
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      settings: data?.settings || {
        'new': {
          assignmentType: 'internal',
          notifyByEmail: true,
          notifyBySMS: false,
          additionalActions: '',
          autoTransition: false,
          requiredFields: ['title', 'description', 'priority'],
        },
        'pending_estimate': {
          assignmentType: 'external',
          notifyByEmail: true,
          notifyBySMS: true,
          additionalActions: '',
          autoTransition: true,
          requiredFields: ['estimateForm', 'deadline'],
        },
        'estimates_received': {
          assignmentType: 'internal',
          notifyByEmail: true,
          notifyBySMS: false,
          additionalActions: '',
          autoTransition: false,
          requiredFields: ['estimateReview', 'approvalStatus'],
        },
        'estimate_accepted': {
          assignmentType: 'internal',
          notifyByEmail: true,
          notifyBySMS: false,
          additionalActions: 'createPO',
          autoTransition: false,
          requiredFields: ['selectedEstimate'],
        },
        'po_issued': {
          assignmentType: 'internal',
          notifyByEmail: true,
          notifyBySMS: true,
          additionalActions: 'notifyVendor',
          autoTransition: false,
          requiredFields: ['poNumber', 'approvers'],
          approvalWorkflow: {
            enabled: true,
            requiredApprovals: 1,
            escalateAfterHours: 48,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching workflow settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getServiceRoleSupabase();
    const body = await request.json();
    const { settings } = body;

    const { error } = await supabase
      .from('workflow_settings')
      .upsert({ 
        id: 1, // Single record for workflow settings
        settings,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving workflow settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save workflow settings' },
      { status: 500 }
    );
  }
} 