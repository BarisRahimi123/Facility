import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyInvitationFunction() {
  console.log('🔧 Applying invitation function to database...\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'scripts/fix-invitation-function-safe.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.log('⚠️  Direct execution failed, trying alternative method...');
      
      // If direct execution fails, provide manual instructions
      console.log('\n📝 Please run this SQL manually in your Supabase dashboard:');
      console.log('👉 https://supabase.com/dashboard/project/ahntaamtsypranvnofxy/sql/new\n');
      console.log('Copy and paste the contents of:');
      console.log('scripts/fix-invitation-function-safe.sql\n');
      
      // Show a preview of the SQL
      console.log('Preview of SQL to run:');
      console.log('----------------------------------------');
      console.log(sql.substring(0, 500) + '...\n');
      
      return;
    }
    
    console.log('✅ Invitation function applied successfully!');
    
    // Test the function
    const { error: testError } = await supabase.rpc('send_user_invitation', {
      p_email: 'test@test.com',
      p_role: 'sub_admin',
      p_invited_by: '00000000-0000-0000-0000-000000000000',
      p_organization_id: null,
      p_metadata: {}
    });
    
    if (!testError || testError.message.includes('permission')) {
      console.log('✅ Function is working!');
      console.log('\n🎉 You can now invite sub-admin users!');
    } else {
      console.log('⚠️  Function created but test failed:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n📝 Please manually apply the SQL file in Supabase dashboard');
  }
}

applyInvitationFunction(); 