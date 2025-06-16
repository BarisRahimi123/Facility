import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key for better reliability
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

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const system = searchParams.get('system');
    const location = searchParams.get('location');

    console.log('Starting token validation for:', { token, system, location });

    if (!token) {
      console.error('Token is missing from the request');
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Check if token exists and is valid
    console.log('Querying database for token...');
    const { data: tokenData, error: tokenError } = await supabase
      .from('form_tokens')
      .select('*')
      .eq('token', token)
      .single();

    console.log('Token query result:', { data: tokenData, error: tokenError });

    if (tokenError) {
      console.error('Database error during token validation:', tokenError);
      return NextResponse.json(
        { success: false, error: 'Failed to validate token', details: tokenError.message },
        { status: 500 }
      );
    }

    if (!tokenData) {
      console.log('Token not found in database');
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 404 }
      );
    }

    // Check token status
    if (tokenData.status !== 'active') {
      console.log('Token is not active:', { status: tokenData.status });
      return NextResponse.json(
        { success: false, error: `Token is ${tokenData.status}` },
        { status: 401 }
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at) : null;
    
    console.log('Checking token expiration:', {
      now: now.toISOString(),
      expiresAt: expiresAt?.toISOString()
    });

    if (expiresAt && expiresAt < now) {
      console.log('Token has expired');
      
      // Update token status to expired
      const { error: updateError } = await supabase
        .from('form_tokens')
        .update({ 
          status: 'expired',
          updated_at: now.toISOString()
        })
        .eq('id', tokenData.id);

      if (updateError) {
        console.error('Error updating token status to expired:', updateError);
      }

      return NextResponse.json(
        { success: false, error: 'Token has expired' },
        { status: 401 }
      );
    }

    // Validate metadata if system and location are provided
    if (system && location && tokenData.metadata) {
      const metadata = tokenData.metadata as { system?: string; location?: string };
      if (metadata.system !== system || metadata.location !== location) {
        console.log('Metadata mismatch:', {
          expected: { system, location },
          actual: metadata
        });
        return NextResponse.json(
          { success: false, error: 'Invalid form parameters' },
          { status: 400 }
        );
      }
    }

    console.log('Token validated successfully');
    return NextResponse.json({
      success: true,
      data: {
        token: tokenData.token,
        metadata: tokenData.metadata
      }
    });
  } catch (error) {
    console.error('Unexpected error during token validation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to validate token', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 