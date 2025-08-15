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

    // Check if user exists in custom users table first
    const { data: customUser, error: customError } = await supabase
      .from('users')
      .select('*')
      .eq('email', '85baris@gmail.com')
      .single();

    if (customError && customError.code !== 'PGRST116') {
      console.error('❌ Error checking custom users table:', customError);
      return;
    }

    if (!customUser) {
      console.log('❌ User not found in custom users table');
      
      // Try to find in auth.users directly by listing users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Error listing auth users:', authError);
        return;
      }

      const authUser = authUsers.users.find(user => user.email === '85baris@gmail.com');
      
      if (!authUser) {
        console.log('❌ User not found in auth.users either');
        
        // Create the user
        console.log('🔧 Creating master admin user...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: '85baris@gmail.com',
          password: 'password123',
          email_confirm: true
        });

        if (createError) {
          console.error('❌ Error creating user:', createError);
          return;
        }

        console.log('✅ User created in auth.users');

        // Create user in custom users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: newUser.user.id,
            email: '85baris@gmail.com',
            name: 'Master Admin',
            user_role: 'master_admin',
            organization_id: null
          });

        if (insertError) {
          console.error('❌ Error creating user in custom table:', insertError);
          return;
        }

        console.log('✅ User created in custom users table with master_admin role');
      } else {
        console.log('✅ User found in auth.users but missing from custom users table');
        
        // Create user in custom users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: '85baris@gmail.com',
            name: 'Master Admin',
            user_role: 'master_admin',
            organization_id: null
          });

        if (insertError) {
          console.error('❌ Error creating user in custom table:', insertError);
          return;
        }

        console.log('✅ User added to custom users table with master_admin role');
      }
    } else {
      console.log('✅ User found in custom users table:');
      console.log(`   ID: ${customUser.id}`);
      console.log(`   Name: ${customUser.name}`);
      console.log(`   Email: ${customUser.email}`);
      console.log(`   Role: ${customUser.user_role}`);
      console.log(`   Organization ID: ${customUser.organization_id}`);
      console.log(`   Created: ${customUser.created_at}\n`);

      // Check if role is master_admin
      if (customUser.user_role === 'master_admin') {
        console.log('✅ User has correct master_admin role');
      } else {
        console.log(`❌ User role is '${customUser.user_role}', should be 'master_admin'`);
        
        // Update role to master_admin
        console.log('🔧 Updating user role to master_admin...');
        const { error: updateError } = await supabase
          .from('users')
          .update({ user_role: 'master_admin' })
          .eq('email', '85baris@gmail.com');

        if (updateError) {
          console.error('❌ Error updating user role:', updateError);
        } else {
          console.log('✅ User role updated to master_admin');
        }
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

      // Reset password to ensure it's password123
      console.log('🔧 Setting password to password123...');
      const { error: resetError } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: 'password123'
      });

      if (resetError) {
        console.error('❌ Error setting password:', resetError);
      } else {
        console.log('✅ Password set successfully');
      }
    }

    // Test password by attempting to sign in with a new client
    console.log('\n🔐 Testing password authentication...');
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

    console.log('\n🎉 Master user verification complete!');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

verifyMasterUser(); 