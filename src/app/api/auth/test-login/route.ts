import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Create a Supabase client with service role
    const supabase = await createServiceSupabaseClient();
    
    // Check if the test user exists
    const { data: existingUsers, error: userQueryError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'test@example.com')
      .limit(1);

    if (userQueryError) {
      return NextResponse.json(
        { error: 'Failed to query users', details: userQueryError },
        { status: 500 }
      );
    }

    let userId;
    
    // If no test user exists, create one
    if (!existingUsers || existingUsers.length === 0) {
      // Create a user in the auth.users table
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          first_name: 'Test',
          last_name: 'User'
        }
      });

      if (authError) {
        return NextResponse.json(
          { error: 'Failed to create test user', details: authError },
          { status: 500 }
        );
      }

      userId = authUser.user.id;
    } else {
      userId = existingUsers[0].id;
    }

    // Sign in as the test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Failed to sign in as test user', details: signInError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test user created and signed in successfully',
      user: signInData.user,
      session: signInData.session
    });
  } catch (error) {
    console.error('Error in test login:', error);
    return NextResponse.json(
      { error: 'Test login failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Create a Supabase client with service role
    const supabase = await createServiceSupabaseClient();
    
    // Sign in with the provided credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      // If sign-in fails, try to create the user
      if (signInError.message.includes('Invalid login credentials')) {
        // Create a user in the auth.users table
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: 'Test',
            last_name: 'User'
          }
        });

        if (authError) {
          return NextResponse.json(
            { error: 'Failed to create user', details: authError },
            { status: 500 }
          );
        }

        // Try signing in again
        const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (newSignInError) {
          return NextResponse.json(
            { error: 'Failed to sign in after creating user', details: newSignInError },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'User created and signed in successfully',
          user: newSignInData.user,
          session: newSignInData.session
        });
      }

      return NextResponse.json(
        { error: 'Failed to sign in', details: signInError },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      user: signInData.user,
      session: signInData.session
    });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 