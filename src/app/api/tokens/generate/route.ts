import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Create a Supabase client with service role key
function createServerSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Generate a random token
function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabase();
    const body = await request.json();
    
    // Get expiration time from request or default to 7 days
    const expiresInDays = body.expiresInDays || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const token = generateToken();
    const metadata = body.metadata || {};

    // Insert the token into the database
    const { data: tokenData, error: tokenError } = await supabase
      .from('form_tokens')
      .insert({
        token,
        status: 'active',
        metadata,
        expires_at: expiresAt.toISOString(),
        created_by: body.userId // Optional: if you want to track who created the token
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Error creating token:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Failed to create token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        token: tokenData.token,
        expiresAt: tokenData.expires_at,
        metadata: tokenData.metadata
      }
    });
  } catch (error) {
    console.error('Unexpected error generating token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate token' },
      { status: 500 }
    );
  }
} 