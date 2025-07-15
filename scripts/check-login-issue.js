import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

console.log('✓ Environment variables loaded');
console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsers() {
  console.log('\n🔍 Checking existing users...');
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  No users found in the database');
      console.log('\n💡 To create a test user:');
      console.log('1. Go to http://localhost:3000/auth/sign-up');
      console.log('2. Create an account and verify your email');
      console.log('3. Or use the Supabase dashboard to create a user');
      return;
    }

    console.log(`\n✓ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`\n- ${user.email}`);
      console.log(`  Role: ${user.role || 'Not set'}`);
      console.log(`  Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log(`  Created: ${new Date(user.created_at).toLocaleDateString()}`);
    });

    // Check if we have a master admin
    const masterAdmin = users.find(u => u.role === 'master_admin' || u.role === 'district_approver');
    if (masterAdmin) {
      console.log(`\n✓ Master admin found: ${masterAdmin.email}`);
    } else {
      console.log('\n⚠️  No master admin found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function testAuthConnection() {
  console.log('\n🔍 Testing auth connection...');
  
  try {
    // Test signing in with the master admin account
    const testEmail = '85baris@gmail.com';
    const { data, error } = await supabase.auth.admin.getUserById('dummy-id').catch(e => ({ data: null, error: e }));
    
    if (error?.message?.includes('not found')) {
      console.log('✓ Auth admin API is accessible');
    } else if (error) {
      console.error('⚠️  Auth API error:', error.message);
    }

    // List auth users
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing auth users:', listError);
    } else {
      console.log(`\n✓ Found ${authUsers?.users?.length || 0} auth users`);
      
      if (authUsers?.users && authUsers.users.length > 0) {
        console.log('\nAuth users (first 5):');
        authUsers.users.slice(0, 5).forEach(user => {
          console.log(`- ${user.email} (Created: ${new Date(user.created_at).toLocaleDateString()})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Auth test error:', error);
  }
}

async function checkAuthSettings() {
  console.log('\n🔍 Checking auth settings...');
  
  console.log('\n📝 Common login issues:');
  console.log('1. Email not verified - check your email for verification link');
  console.log('2. Wrong password - try resetting at /auth/reset-password');
  console.log('3. Account disabled - check is_active status in users table');
  console.log('4. Browser issues - try incognito mode or different browser');
  console.log('5. Cookie/storage issues - clear browser data');
  
  console.log('\n🔧 Debug steps:');
  console.log('1. Visit http://localhost:3000/auth/debug for system checks');
  console.log('2. Open browser console (F12) and check for errors');
  console.log('3. Check Network tab for failed requests');
  console.log('4. Try the "Clear Storage & Refresh" button on debug page');
}

async function main() {
  console.log('🚀 Login Issue Diagnostics\n');
  
  await checkUsers();
  await testAuthConnection();
  await checkAuthSettings();
  
  console.log('\n✅ Diagnostics complete');
  console.log('\n🔗 Next steps:');
  console.log('- Visit http://localhost:3000/auth/debug');
  console.log('- Try signing in with one of the existing users');
  console.log('- Check browser console for errors');
}

main().catch(console.error); 