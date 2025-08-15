import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applyMigration() {
  console.log('🚀 Applying QR Code Maintenance System migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250131_create_qr_maintenance_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('⚠️  This migration will create:');
    console.log('   - maintenance_qr_codes table');
    console.log('   - maintenance_issue_reports table');
    console.log('   - maintenance_issue_activities table');
    console.log('   - Related functions and triggers');
    console.log('   - RLS policies\n');

    console.log('❗ IMPORTANT: This migration must be run manually in the Supabase SQL Editor.');
    console.log('📋 Steps to apply:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy and paste the contents from:');
    console.log(`   ${migrationPath}`);
    console.log('5. Click "Run" to execute the migration\n');

    // Test if tables already exist
    const { data: qrTable, error: qrError } = await supabase
      .from('maintenance_qr_codes')
      .select('id')
      .limit(1);

    if (!qrError) {
      console.log('✅ maintenance_qr_codes table already exists');
    } else if (qrError.code === '42P01') {
      console.log('⚠️  maintenance_qr_codes table does not exist - needs migration');
    }

    const { data: issueTable, error: issueError } = await supabase
      .from('maintenance_issue_reports')
      .select('id')
      .limit(1);

    if (!issueError) {
      console.log('✅ maintenance_issue_reports table already exists');
    } else if (issueError.code === '42P01') {
      console.log('⚠️  maintenance_issue_reports table does not exist - needs migration');
    }

    console.log('\n📝 Migration file has been prepared at:');
    console.log(`   ${migrationPath}`);
    console.log('\nPlease apply it manually in the Supabase SQL Editor.');

  } catch (error) {
    console.error('❌ Error during migration check:', error);
    process.exit(1);
  }
}

applyMigration();





