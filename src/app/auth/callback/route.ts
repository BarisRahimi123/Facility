import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This route handles the callback from Supabase Auth email confirmations
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/facilities';

  if (code) {
    const cookieStore = cookies();
    const supabase = await createClient();
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // Successful authentication - redirect to the next URL
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    } catch (error) {
      console.error('Error exchanging code for session:', error);
    }
  }

  // Return to sign-in page if there's an error
  return NextResponse.redirect(new URL('/auth/sign-in-simple', requestUrl.origin));
} 