import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInvitationSystem() {
  console.log('🔍 Checking invitation system...\n');
  
  // Check if function exists
  const { data: functions, error: funcError } = await supabase
    .rpc('pg_proc', {})
    .select('proname')
    .eq('proname', 'send_user_invitation');
    
  if (funcError) {
    console.log('❌ Could not check for function existence');
    console.log('Error:', funcError.message);
  }
  
  // Check if user_invitations table exists
  const { data: tables, error: tableError } = await supabase
    .from('user_invitations')
    .select('id')
    .limit(1);
    
  if (tableError && tableError.message.includes('relation') && tableError.message.includes('does not exist')) {
    console.log('❌ user_invitations table does not exist');
    console.log('📝 You need to run the invitation system migration');
    console.log('\nRun this SQL in your Supabase dashboard:');
    console.log('https://supabase.com/dashboard/project/ahntaamtsypranvnofxy/sql/new');
    console.log('\nOr run: node scripts/apply-invitation-migration.js');
  } else if (tableError) {
    console.log('⚠️  Error checking table:', tableError.message);
  } else {
    console.log('✅ user_invitations table exists');
  }
  
  // Try to call the function
  const { error: rpcError } = await supabase.rpc('send_user_invitation', {
    p_email: 'test@test.com',
    p_role: 'sub_admin',
    p_invited_by: '00000000-0000-0000-0000-000000000000',
    p_organization_id: null,
    p_metadata: {}
  });
  
  if (rpcError && rpcError.message.includes('does not exist')) {
    console.log('❌ send_user_invitation function does not exist');
    console.log('📝 You need to create the invitation function');
  } else if (rpcError) {
    console.log('⚠️  Function exists but returned error:', rpcError.message);
  } else {
    console.log('✅ send_user_invitation function exists');
  }
}

checkInvitationSystem(); 