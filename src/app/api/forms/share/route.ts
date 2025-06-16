import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { 
      formId, 
      password, 
      expiryDays = 7,
      responseLimit,
      accessType = 'public',
      customSlug 
    } = await request.json();

    // Generate a unique token/slug for the form
    const slug = customSlug || nanoid(10);

    // Check if custom slug is already in use
    if (customSlug) {
      const { data: existingShare } = await supabase
        .from('form_shares')
        .select('id')
        .eq('slug', customSlug)
        .single();

      if (existingShare) {
        return NextResponse.json(
          { error: 'This custom URL is already in use' },
          { status: 400 }
        );
      }
    }

    // Store the form sharing information
    const { data: share, error: dbError } = await supabase
      .from('form_shares')
      .insert({
        form_id: formId,
        slug,
        password: password ? password : null,
        access_type: accessType,
        expires_at: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString(),
        response_limit: responseLimit || null,
        responses_count: 0,
        status: 'active'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Generate the form URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const formUrl = `${baseUrl}/forms/shared/${slug}`;

    return NextResponse.json({
      success: true,
      url: formUrl,
      share
    });
  } catch (error: any) {
    console.error('Form sharing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to share form' },
      { status: 500 }
    );
  }
} 