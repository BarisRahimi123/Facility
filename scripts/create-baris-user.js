// Script to create the user 85baris@gmail.com in the database
// Run this with: node scripts/create-baris-user.js

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBarisUser() {
  try {
    console.log('🔍 Checking if user 85baris@gmail.com already exists...');
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', '85baris@gmail.com')
      .single();

    if (existingUser) {
      console.log('✅ User 85baris@gmail.com already exists in database');
      return;
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking user:', checkError.message);
      return;
    }

    console.log('👤 Creating user 85baris@gmail.com...');

    // Create the user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: '85baris@gmail.com',
          full_name: 'Baris User',
          role: 'renter',
          phone: '+1555123456',
          is_active: true,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating user:', error.message);
      return;
    }

    console.log('✅ Successfully created user 85baris@gmail.com');
    console.log('📋 User details:', {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      is_active: data.is_active
    });

    console.log('\n📝 Next steps:');
    console.log('1. The user 85baris@gmail.com needs to create a Supabase auth account');
    console.log('2. They can do this by going to /auth/sign-up or by having an admin invite them');
    console.log('3. Once they have a Supabase auth account, they can sign in normally');

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
  console.log('🚀 Starting user creation script...\n');

  const connected = await checkSupabaseConnection();
  if (!connected) {
    console.log('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }

  await createBarisUser();
  
  console.log('\n✨ Script completed!');
}

main().catch(console.error); 