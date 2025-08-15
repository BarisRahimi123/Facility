import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure your .env.local file contains:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the SQL migration file
const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'create-issue-reports-table.sql'),
  'utf8'
);

async function applyMigration() {
  console.log('🚀 Applying maintenance_issue_reports table migration...\n');

  try {
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    }).single();

    if (error) {
      // If exec_sql doesn't exist, try a different approach
      console.log('⚠️  Direct SQL execution not available, please apply manually via Supabase dashboard');
      console.log('\n📋 Manual Steps:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy the contents of scripts/create-issue-reports-table.sql');
      console.log('4. Paste and run the SQL');
      return false;
    }

    console.log('✅ Migration applied successfully!');
    
    // Test the table
    const { data, error: testError } = await supabase
      .from('maintenance_issue_reports')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Table verification failed:', testError.message);
      return false;
    }
    
    console.log('✅ Table maintenance_issue_reports is ready to use');
    console.log('\n🎉 Issue reporting is now enabled!');
    return true;

  } catch (err) {
    console.error('❌ Migration failed:', err);
    console.log('\n📋 Please apply the migration manually:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the contents of scripts/create-issue-reports-table.sql');
    console.log('4. Paste and run the SQL');
    return false;
  }
}

applyMigration().then(success => {
  if (success) {
    console.log('\n✨ You can now submit issues from the maintenance page!');
  } else {
    console.log('\n⚠️  Migration needs to be applied manually via Supabase dashboard');
  }
});
