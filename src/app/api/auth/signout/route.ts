import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase signOut error:', error);
    }
    
    // Clear all auth-related cookies (must await cookies() in App Router)
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    // Prepare response
    const response = NextResponse.json(
      { success: true, message: 'Signed out successfully' },
      { status: 200 }
    );
    
    // Delete all auth-related cookies
    allCookies.forEach(cookie => {
      const name = cookie.name;
      // Supabase sets cookies with names like: sb-<project-ref>-auth-token and others
      const shouldDelete =
        name.startsWith('sb-') ||
        name.includes('supabase') ||
        name.includes('auth');

      if (shouldDelete) {
        try {
          response.cookies.delete(name);
        } catch (err) {
          // Fallback: explicitly expire cookie
          response.cookies.set({ name, value: '', maxAge: 0 });
        }
      }
    });
    
    return response;
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST method to sign out' });
}