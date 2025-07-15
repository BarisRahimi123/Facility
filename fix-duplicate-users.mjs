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

async function fixDuplicateUsers() {
  console.log('Finding and fixing duplicate user entries...\n');
  
  // Find emails with duplicates
  const { data: duplicates, error } = await supabase
    .from('users')
    .select('email')
    .select('email, count(*)', { count: 'exact' });
    
  // Get all users
  const { data: allUsers, error: allError } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (allError) {
    console.error('Error fetching users:', allError);
    return;
  }
  
  // Group by email
  const usersByEmail = {};
  allUsers.forEach(user => {
    if (!usersByEmail[user.email]) {
      usersByEmail[user.email] = [];
    }
    usersByEmail[user.email].push(user);
  });
  
  // Find and handle duplicates
  for (const email in usersByEmail) {
    const users = usersByEmail[email];
    if (users.length > 1) {
      console.log(`\n📧 Email: ${email}`);
      console.log(`Found ${users.length} entries:`);
      
      // Check which one matches auth
      const { data: authUser } = await supabase.auth.admin.getUserByEmail(email);
      
      users.forEach((user, index) => {
        const isAuthMatch = authUser && authUser.id === user.id;
        console.log(`  ${index + 1}. ID: ${user.id}`);
        console.log(`     Role: ${user.role || 'N/A'}`);
        console.log(`     Created: ${user.created_at || 'N/A'}`);
        console.log(`     Auth Match: ${isAuthMatch ? '✅' : '❌'}`);
      });
      
      // Keep the one that matches auth, or the oldest one
      const keepUser = users.find(u => authUser && u.id === authUser.id) || users[0];
      const deleteUsers = users.filter(u => u.id !== keepUser.id);
      
      console.log(`\n  Keeping: ${keepUser.id} (${keepUser.role || 'no role'})`);
      console.log(`  Deleting: ${deleteUsers.length} duplicate(s)`);
      
      // Delete duplicates
      for (const deleteUser of deleteUsers) {
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', deleteUser.id);
          
        if (deleteError) {
          console.error(`  ❌ Error deleting ${deleteUser.id}:`, deleteError.message);
        } else {
          console.log(`  ✅ Deleted ${deleteUser.id}`);
        }
      }
    }
  }
  
  console.log('\n✅ Duplicate cleanup complete!');
}

fixDuplicateUsers();
