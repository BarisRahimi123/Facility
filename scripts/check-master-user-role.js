import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMasterUser() {
  try {
    console.log('🔍 Checking master user role in database...\n');
    
    // Check master user by email
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', '85baris@gmail.com')
      .single();
    
    if (error) {
      console.log('❌ Error fetching user:', error.message);
      return;
    }
    
    if (!userData) {
      console.log('❌ Master user not found in users table');
      return;
    }
    
    console.log('✅ Master user found:');
    console.log(`  Email: ${userData.email}`);
    console.log(`  Role: ${userData.role}`);
    console.log(`  Full Name: ${userData.full_name}`);
    console.log(`  Active: ${userData.is_active}`);
    console.log(`  Created: ${userData.created_at}`);
    console.log(`  Organization ID: ${userData.organization_id}`);
    
    // Check auth.users table too
    console.log('\n🔍 Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error fetching auth users:', authError.message);
      return;
    }
    
    const masterAuthUser = authUsers.users.find(u => u.email === '85baris@gmail.com');
    if (masterAuthUser) {
      console.log('✅ Master user in auth.users:');
      console.log(`  Email: ${masterAuthUser.email}`);
      console.log(`  ID: ${masterAuthUser.id}`);
      console.log(`  User Metadata:`, masterAuthUser.user_metadata);
      console.log(`  App Metadata:`, masterAuthUser.app_metadata);
      
      // Check if IDs match
      if (masterAuthUser.id === userData.id) {
        console.log('✅ User IDs match between auth.users and users table');
      } else {
        console.log('❌ User ID mismatch!');
        console.log(`  auth.users ID: ${masterAuthUser.id}`);
        console.log(`  users table ID: ${userData.id}`);
      }
    } else {
      console.log('❌ Master user not found in auth.users');
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkMasterUser();
