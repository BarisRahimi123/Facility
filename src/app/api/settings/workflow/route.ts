import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
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
    const supabase = createRouteHandlerClient({ cookies });
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