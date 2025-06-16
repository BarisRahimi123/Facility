import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { token, formData } = await request.json();

    // Get the form share
    const { data: formShare, error: formShareError } = await supabase
      .from('form_shares')
      .select('*')
      .eq('token', token)
      .single();

    if (formShareError) throw formShareError;
    if (!formShare) throw new Error('Form not found');

    // Check if form is expired or already completed
    if (new Date(formShare.expires_at) < new Date()) {
      throw new Error('This form has expired');
    }
    if (formShare.status !== 'pending') {
      throw new Error('This form has already been submitted');
    }

    // Create the facility system
    const { data: system, error: systemError } = await supabase
      .from('facility_systems')
      .insert({
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (systemError) throw systemError;

    // Update form share status
    const { error: updateError } = await supabase
      .from('form_shares')
      .update({
        status: 'completed',
        response_data: formData,
        updated_at: new Date().toISOString()
      })
      .eq('token', token);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      system
    });
  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit form' },
      { status: 500 }
    );
  }
} 