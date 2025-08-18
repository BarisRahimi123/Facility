import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsersTableStructure() {
  try {
    console.log('🔍 Checking users table structure...\n');

    // Check table columns
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' });

    if (columnsError) {
      // Fallback: try to get a sample user and see what columns exist
      console.log('📋 Getting sample user to check columns...');
      
      const { data: sampleUser, error: sampleError } = await supabase
        .from('users')
        .select('*')
        .limit(1)
        .single();

      if (sampleError) {
        console.error('❌ Error getting sample user:', sampleError);
        return;
      }

      console.log('✅ Sample user structure:');
      console.log(JSON.stringify(sampleUser, null, 2));
      
      // Check if user_role column exists
      if (sampleUser.hasOwnProperty('user_role')) {
        console.log('\n✅ user_role column exists');
      } else {
        console.log('\n❌ user_role column is missing');
        console.log('📋 Available columns:', Object.keys(sampleUser));
      }
    } else {
      console.log('✅ Table columns:');
      console.log(columns);
    }

    // Check if the enum type exists
    console.log('\n🔍 Checking user_role enum type...');
    const { data: enumData, error: enumError } = await supabase
      .from('pg_type')
      .select('typname')
      .eq('typname', 'user_role');

    if (enumError) {
      console.error('❌ Error checking enum type:', enumError);
    } else if (enumData.length === 0) {
      console.log('❌ user_role enum type does not exist');
    } else {
      console.log('✅ user_role enum type exists');
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkUsersTableStructure(); 