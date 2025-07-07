const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function resetPassword() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables!');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Password Reset Helper for 85baris@gmail.com\n');
  
  console.log('Option 1: Request password reset email');
  console.log('=========================================');
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail('85baris@gmail.com', {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`,
    });
    
    if (error) {
      console.log('❌ Error sending reset email:', error.message);
    } else {
      console.log('✓ Password reset email sent to 85baris@gmail.com');
      console.log('  Check your email and click the reset link');
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
  
  console.log('\nOption 2: Manual instructions');
  console.log('=============================');
  console.log('1. Go to: http://localhost:3000/auth/reset-password');
  console.log('2. Enter email: 85baris@gmail.com');
  console.log('3. Check your email for the reset link');
  console.log('4. Click the link and set a new password');
  
  console.log('\nOption 3: Try signing up again');
  console.log('==============================');
  console.log('1. Go to: http://localhost:3000/auth/sign-up');
  console.log('2. Use email: 85baris@gmail.com');
  console.log('3. If it says "User already exists", use password reset instead');
}

resetPassword(); 