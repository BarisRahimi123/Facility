// Script to update 85baris@gmail.com role to district_approver (highest admin role)
// Run this with: node scripts/update-baris-role-to-admin.js

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
  console.error('SUPABASE KEY:', supabaseKey ? '✅ Found' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBarisRole() {
  try {
    console.log('🔍 Checking current user role for 85baris@gmail.com...');
    
    // Check current user role
    const { data: currentUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('email', '85baris@gmail.com')
      .single();

    if (checkError) {
      console.error('❌ Error finding user:', checkError.message);
      return;
    }

    if (!currentUser) {
      console.error('❌ User 85baris@gmail.com not found in database');
      return;
    }

    console.log('📋 Current user details:', {
      id: currentUser.id,
      email: currentUser.email,
      full_name: currentUser.full_name,
      role: currentUser.role
    });

    if (currentUser.role === 'district_approver') {
      console.log('✅ User already has district_approver role (highest admin level)!');
      return;
    }

    console.log(`🔄 Updating role from '${currentUser.role}' to 'district_approver'...`);
    console.log('\n📝 Note: The database uses these roles:');
    console.log('- renter: Basic user with rental permissions');
    console.log('- staff: Staff member with admin access');
    console.log('- site_approver: Site-level approval permissions');
    console.log('- district_approver: Highest level - district-wide permissions');
    console.log('- maintenance: Maintenance staff permissions');
    console.log('- support: Support staff permissions\n');

    // Update the user role to district_approver
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'district_approver' })
      .eq('email', '85baris@gmail.com')
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user role:', error.message);
      return;
    }

    console.log('✅ Successfully updated user role to district_approver!');
    console.log('📋 Updated user details:', {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role
    });

    console.log('\n📝 What this means:');
    console.log('- User now has the HIGHEST level of access in the system');
    console.log('- Can access: All facilities, people, analytics, and admin features');
    console.log('- Has district-wide approval permissions');
    console.log('- Can manage all users, facilities, and system settings');
    console.log('- This is equivalent to "super admin" access');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function checkSupabaseConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Failed to connect to Supabase:', error.message);
      return false;
    }

    console.log(`✅ Connected to Supabase successfully.`);
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting role update script...\n');

  const connected = await checkSupabaseConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }

  await updateBarisRole();
  
  console.log('\n✨ Script completed!');
}

main().catch(console.error); 