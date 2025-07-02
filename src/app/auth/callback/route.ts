import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// This route handles the callback from Supabase Auth email confirmations
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    const cookieStore = cookies();
    const supabase = await createClient();
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // If there's a specific next parameter, use it
        if (next) {
          return NextResponse.redirect(new URL(next, requestUrl.origin));
        }

        // Otherwise, determine redirect based on user role
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Check if user exists in our users table
            const { data: userProfile } = await supabase
              .from('users')
              .select('*')
              .eq('email', user.email)
              .single();

            // If user doesn't exist in our users table, create them
            if (!userProfile) {
              console.log('Creating user record for verified user:', user.email);
              
              // Get user metadata from auth
              const metadata = user.user_metadata || {};
              const organizationId = metadata.organization_id || null;
              
              const { error: createError } = await supabase
                .from('users')
                .insert({
                  id: user.id,
                  email: user.email,
                  full_name: metadata.full_name || '',
                  phone: metadata.phone || '',
                  role: metadata.role || 'renter',
                  is_active: true,
                  organization_id: organizationId,
                });

              if (createError) {
                console.error('Error creating user record:', createError);
                // Continue anyway as auth was successful
              }
            }

            // Redirect based on user role (use existing profile or fallback to metadata)
            const userRole = userProfile?.role || user.user_metadata?.role || 'renter';
            
            if (userRole === 'staff' || userRole === 'manager' || userRole === 'coordinator') {
              return NextResponse.redirect(new URL('/staff', requestUrl.origin));
            } else if (userRole === 'renter') {
              return NextResponse.redirect(new URL('/facilities-map', requestUrl.origin));
            } else {
              // Admin or unknown users go to facilities map
              return NextResponse.redirect(new URL('/facilities-map', requestUrl.origin));
            }
          }
        } catch (roleError) {
          console.error('Error determining user role:', roleError);
        }

        // Default fallback - redirect to user dashboard for regular users
        return NextResponse.redirect(new URL('/user-dashboard', requestUrl.origin));
      }
    } catch (error) {
      console.error('Error exchanging code for session:', error);
    }
  }

  // Return to sign-in page if there's an error
  return NextResponse.redirect(new URL('/auth/sign-in', requestUrl.origin));
} 