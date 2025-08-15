import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Sign out the user
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Server-side sign out error:', error);
    }

    // Create response that clears all auth cookies
    const response = NextResponse.json({ success: true });
    
    // Clear all possible Supabase auth cookies
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token', 
      'supabase-auth-token',
      'supabase.auth.token',
      'sb-auth-token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        path: '/',
        domain: undefined,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      });
    });

    // Also clear any cookies that start with sb-
    const allCookieNames = [
      'sb-localhost-auth-token',
      'sb-127-auth-token',
      'sb-project-ref-auth-token'
    ];
    
    allCookieNames.forEach(cookieName => {
      response.cookies.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        path: '/',
        domain: undefined,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
      });
    });

    return response;
  } catch (error) {
    console.error('Error in signout API:', error);
    return NextResponse.json({ error: 'Sign out failed' }, { status: 500 });
  }
} 