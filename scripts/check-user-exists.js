const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables!');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('Checking for user: 85baris@gmail.com\n');
  
  // Check in users table
  console.log('1. Checking users table...');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', '85baris@gmail.com');
      
    if (error) {
      console.log('❌ Error checking users table:', error.message);
    } else if (users && users.length > 0) {
      console.log('✓ User found in users table:');
      users.forEach(user => {
        console.log('  - ID:', user.id);
        console.log('  - Email:', user.email);
        console.log('  - Name:', user.name);
        console.log('  - Role:', user.role);
        console.log('  - Created:', user.created_at);
      });
    } else {
      console.log('❌ User not found in users table');
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
  
  // Check auth.users (requires service role key)
  console.log('\n2. Checking auth.users table...');
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data: authUsers, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.log('❌ Error checking auth users:', error.message);
      } else {
        const user = authUsers.users.find(u => u.email === '85baris@gmail.com');
        if (user) {
          console.log('✓ User found in auth.users:');
          console.log('  - ID:', user.id);
          console.log('  - Email:', user.email);
          console.log('  - Confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
          console.log('  - Created:', user.created_at);
          console.log('  - Last Sign In:', user.last_sign_in_at || 'Never');
        } else {
          console.log('❌ User not found in auth.users');
        }
      }
    } catch (e) {
      console.log('⚠️  Cannot check auth.users (requires service role key)');
    }
  } else {
    console.log('⚠️  Service role key not available, cannot check auth.users table');
  }
  
  console.log('\n3. Recommendations:');
  console.log('If user exists in users table but not in auth.users:');
  console.log('  - User needs to be created in the auth system');
  console.log('  - They may need to sign up or reset their password');
  console.log('\nIf authentication fails:');
  console.log('  - User may need to reset password');
  console.log('  - Email may not be verified');
  console.log('  - Password may be incorrect');
}

checkUser(); 