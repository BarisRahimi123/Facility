import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyUser() {
  const email = 'bid4wgcc@gmail.com';
  
  try {
    // Get user from auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    const authUser = users?.find(u => u.email === email);
    
    if (authUser) {
      console.log('✅ Found user:', email);
      console.log('📧 Email confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No');
      
      if (!authUser.email_confirmed_at) {
        // Update to confirm email
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          authUser.id,
          { 
            email_confirmed_at: new Date().toISOString(),
            confirmed_at: new Date().toISOString()
          }
        );
        
        if (!updateError) {
          console.log('✅ Email verified successfully!');
          console.log('🎉 You can now log in!');
        } else {
          console.log('❌ Error updating:', updateError.message);
        }
      } else {
        console.log('✅ Email already verified! You can log in.');
      }
    } else {
      console.log('❌ User not found:', email);
      console.log('Make sure you signed up first.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyUser(); 