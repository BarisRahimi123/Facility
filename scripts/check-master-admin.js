#!/usr/bin/env node

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
  console.error('❌ Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMasterAdmin() {
  console.log('🔍 Checking master admin status for 85baris@gmail.com...\n');

  // Check in users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', '85baris@gmail.com')
    .single();

  if (userError) {
    console.error('❌ Error fetching from users table:', userError.message);
    console.log('\n📝 User might not exist in users table.');
  } else if (userData) {
    console.log('✅ Found in users table:');
    console.log('  - ID:', userData.id);
    console.log('  - Email:', userData.email);
    console.log('  - Role:', userData.role || 'NOT SET');
    console.log('  - Organization ID:', userData.organization_id || 'NOT SET');
    console.log('  - Full Name:', userData.full_name || userData.name || 'NOT SET');
    console.log('  - Created:', userData.created_at);
    
    if (userData.role === 'master_admin') {
      console.log('\n🎉 User is correctly set as MASTER_ADMIN!');
    } else {
      console.log('\n⚠️  User role is NOT master_admin. Current role:', userData.role);
      console.log('\n📝 To fix this, run the following SQL in Supabase:');
      console.log(`UPDATE users SET role = 'master_admin' WHERE email = '85baris@gmail.com';`);
    }
  }

  // Check in auth.users table
  console.log('\n🔍 Checking Supabase Auth table...');
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  
  if (!authError && authData) {
    const authUser = authData.users.find(u => u.email === '85baris@gmail.com');
    if (authUser) {
      console.log('✅ Found in auth.users:');
      console.log('  - Auth ID:', authUser.id);
      console.log('  - Email:', authUser.email);
      console.log('  - Last Sign In:', authUser.last_sign_in_at);
      console.log('  - Email Confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No');
    } else {
      console.log('❌ User not found in auth.users table');
      console.log('📝 User needs to sign up first at your application');
    }
  }

  // Check organizations
  console.log('\n🔍 Checking organizations...');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(5);

  if (!orgError && orgs && orgs.length > 0) {
    console.log('✅ Found organizations:');
    orgs.forEach(org => {
      console.log(`  - ${org.name || 'Unnamed'} (${org.id})`);
    });
    
    if (userData && !userData.organization_id) {
      console.log('\n⚠️  User has no organization assigned!');
      console.log('📝 To fix, run this SQL:');
      console.log(`UPDATE users SET organization_id = '${orgs[0].id}' WHERE email = '85baris@gmail.com';`);
    }
  } else {
    console.log('❌ No organizations found');
    console.log('📝 You may need to create an organization first');
  }

  console.log('\n✨ Check complete!');
}

checkMasterAdmin().catch(console.error);
