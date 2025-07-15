import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserProfile() {
  console.log('Checking user profile issues...\n');
  
  // Get the current authenticated user (you'll need to provide the user ID)
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  console.log(`Found ${users.length} auth users\n`);
  
  // Check if users exist in the users table
  for (const authUser of users.slice(0, 5)) { // Check first 5 users
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();
    
    if (profileError) {
      console.log(`❌ User ${authUser.email} (${authUser.id}):`);
      console.log(`   Error: ${profileError.message}`);
      
      // Try with email instead
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();
        
      if (!emailError && userByEmail) {
        console.log(`   ⚠️  Found by email but ID mismatch!`);
        console.log(`   Auth ID: ${authUser.id}`);
        console.log(`   DB ID: ${userByEmail.id}`);
      }
    } else {
      console.log(`✅ User ${authUser.email}: Found in users table`);
    }
  }
}

checkUserProfile();
