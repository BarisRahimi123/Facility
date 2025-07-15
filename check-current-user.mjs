import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

// You might need to provide the current user's email
const currentUserEmail = '85baris@gmail.com'; // Change this to the logged-in user's email

async function checkCurrentUser() {
  console.log(`Checking user: ${currentUserEmail}\n`);
  
  // Check users table by email
  const { data: usersByEmail, error: emailError } = await supabase
    .from('users')
    .select('*')
    .eq('email', currentUserEmail);
    
  if (emailError) {
    console.log('❌ User table lookup by email failed:', emailError.message);
  } else {
    console.log(`Found ${usersByEmail.length} user(s) by email in users table\n`);
    usersByEmail.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Full Name: ${user.full_name || 'Not set'}`);
      console.log(`  Active: ${user.is_active}`);
      console.log(`  Created: ${user.created_at || 'N/A'}`);
      console.log('');
    });
  }
}

checkCurrentUser();
