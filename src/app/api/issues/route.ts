import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase/server';
import type { MaintenanceTask } from '@/types/maintenance';

export async function GET(request: Request) {
  const supabase = getServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const facilityId = searchParams.get('facilityId');

  let query = supabase
    .from('maintenance_tasks')
    .select(`
      *,
      request_for_quotes (
        *,
        vendor_estimates (
          *,
          estimate_line_items (*)
        )
      )
    `);

  if (facilityId) {
    query = query.eq('facility_id', facilityId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data || [] });
}

export async function POST(request: Request) {
  const supabase = getServiceRoleClient();
  
  try {
    const formData = await request.json();
    console.log('Received form data:', formData);

    if (formData.token) {
      const { data: tokenData, error: tokenError } = await supabase
        .from('form_tokens')
        .select('*')
        .eq('token', formData.token)
        .single();

      if (tokenError || !tokenData) {
        console.error('Token validation error:', tokenError);
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      if (tokenData.status !== 'active' || new Date(tokenData.expires_at) < new Date()) {
        return NextResponse.json(
          { success: false, error: 'Token has expired' },
          { status: 401 }
        );
      }
    }

    const requiredFields = ['systemType', 'issueType', 'description', 'submitterName', 'submitterEmail'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          details: `Missing fields: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    const taskData = {
      title: `${formData.systemType} Issue: ${formData.issueType}`,
      description: formData.description,
      type: 'corrective',
      priority: calculatePriority(formData.impact, formData.severity),
      status: 'new',
      workflow_status: 'new',
      start_date: new Date().toISOString(),
      estimated_duration: 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: formData.submitterName,
      updated_by: formData.submitterName,
      location: formData.location || 'Unknown Location',
      system_type: formData.systemType,
      issue_type: formData.issueType,
      impact: formData.impact || 'low',
      severity: formData.severity || 'low',
      submitter_info: {
        name: formData.submitterName,
        email: formData.submitterEmail,
        phone: formData.submitterPhone || null,
        token: formData.token || null
      }
    };

    console.log('Attempting to insert task with data:', taskData);

    const { data: task, error: insertError } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create task',
          details: insertError.message,
          code: insertError.code
        },
        { status: 500 }
      );
    }

    if (!task) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No task was created',
          details: 'The database operation succeeded but no task was returned'
        },
        { status: 500 }
      );
    }

    if (formData.token) {
      await supabase
        .from('form_tokens')
        .update({ status: 'used', used_at: new Date().toISOString() })
        .eq('token', formData.token);
    }

    console.log('Task created successfully:', task);
    return NextResponse.json({ success: true, task });
    
  } catch (error) {
    console.error('Outer error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function calculatePriority(impact?: 'low' | 'medium' | 'high', severity?: 'low' | 'medium' | 'high'): MaintenanceTask['priority'] {
  if (!impact || !severity) return 'medium';

  if (impact === 'high' && severity === 'high') return 'critical';
  if (impact === 'high' || severity === 'high') return 'high';
  if (impact === 'medium' || severity === 'medium') return 'medium';
  return 'low';
}
