import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyMasterUser() {
  try {
    console.log('🔍 Checking user 85baris@gmail.com...\n');

    // Check if user exists in custom users table
    const { data: customUser, error: customError } = await supabase
      .from('users')
      .select('*')
      .eq('email', '85baris@gmail.com')
      .single();

    if (customError) {
      console.error('❌ Error checking custom users table:', customError);
      return;
    }

    if (!customUser) {
      console.log('❌ User not found in custom users table');
      return;
    }

    console.log('✅ User found in custom users table:');
    console.log(`   ID: ${customUser.id}`);
    console.log(`   Full Name: ${customUser.full_name}`);
    console.log(`   Email: ${customUser.email}`);
    console.log(`   Role: ${customUser.role}`);
    console.log(`   Organization ID: ${customUser.organization_id}`);
    console.log(`   Phone: ${customUser.phone}`);
    console.log(`   Active: ${customUser.is_active}`);
    console.log(`   Created: ${customUser.created_at}\n`);

    // Check if role is master_admin
    if (customUser.role === 'master_admin') {
      console.log('✅ User has correct master_admin role');
    } else {
      console.log(`❌ User role is '${customUser.role}', should be 'master_admin'`);
      return;
    }

    // Get the auth user for password testing
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error listing auth users:', authError);
      return;
    }

    const authUser = authUsers.users.find(user => user.email === '85baris@gmail.com');
    
    if (!authUser) {
      console.log('❌ User not found in auth.users');
      return;
    }

    console.log('✅ User found in auth.users:');
    console.log(`   ID: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   Created: ${authUser.created_at}`);
    console.log(`   Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}\n`);

    // Test password by attempting to sign in with a new client
    console.log('🔐 Testing password authentication...');
    const testClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await testClient.auth.signInWithPassword({
      email: '85baris@gmail.com',
      password: 'password123'
    });

    if (signInError) {
      console.error('❌ Password authentication failed:', signInError.message);
    } else {
      console.log('✅ Password authentication successful');
      console.log(`   Session user ID: ${signInData.user.id}`);
      await testClient.auth.signOut();
    }

    // Check organization
    if (customUser.organization_id) {
      console.log('\n🏢 Checking organization...');
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', customUser.organization_id)
        .single();

      if (orgError) {
        console.error('❌ Error checking organization:', orgError);
      } else {
        console.log('✅ Organization found:');
        console.log(`   ID: ${org.id}`);
        console.log(`   Name: ${org.name}`);
        console.log(`   Type: ${org.type}`);
        console.log(`   Active: ${org.is_active}`);
      }
    }

    console.log('\n🎉 Master user verification complete!');
    console.log('\n📋 Login Details:');
    console.log('   📧 Email: 85baris@gmail.com');
    console.log('   🔒 Password: password123');
    console.log('   👑 Role: master_admin');
    console.log('   🏢 Organization: Platform Master Organization');
    console.log('   ✅ Ready to login at http://localhost:3000/auth/sign-in');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

verifyMasterUser(); 