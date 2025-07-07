const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAuthAndUser() {
  try {
    console.log('🔍 Checking Supabase Auth and User Status...\n');

    // Check auth.users table
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (authError) {
      console.error('❌ Error checking auth.users:', authError);
    } else {
      console.log('📋 Recent Auth Users:');
      authUsers?.forEach(user => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
      console.log('');
    }

    // Check custom users table
    const { data: customUsers, error: customError } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active')
      .order('created_at', { ascending: false })
      .limit(10);

    if (customError) {
      console.error('❌ Error checking users table:', customError);
    } else {
      console.log('📋 Recent Custom Users:');
      customUsers?.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - Active: ${user.is_active}`);
      });
      console.log('');
    }

    // Check for mismatches
    console.log('🔍 Checking for mismatches...\n');
    
    if (authUsers && customUsers) {
      const authEmails = new Set(authUsers.map(u => u.email));
      const customEmails = new Set(customUsers.map(u => u.email));
      
      const inAuthNotCustom = [...authEmails].filter(email => !customEmails.has(email));
      const inCustomNotAuth = [...customEmails].filter(email => !authEmails.has(email));
      
      if (inAuthNotCustom.length > 0) {
        console.log('⚠️  Users in auth.users but NOT in custom users table:');
        inAuthNotCustom.forEach(email => {
          console.log(`  - ${email} (needs user record created)`);
        });
        console.log('');
      }
      
      if (inCustomNotAuth.length > 0) {
        console.log('⚠️  Users in custom table but NOT in auth.users:');
        inCustomNotAuth.forEach(email => {
          console.log(`  - ${email} (orphaned record)`);
        });
        console.log('');
      }
      
      if (inAuthNotCustom.length === 0 && inCustomNotAuth.length === 0) {
        console.log('✅ All auth users have matching custom user records!');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAuthAndUser(); 