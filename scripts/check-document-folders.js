import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDocumentFolders() {
  console.log('🔍 Checking document folders table...\n');

  try {
    // Check if document_folders table exists
    const { data: tables, error: tableError } = await supabase
      .from('document_folders')
      .select('id')
      .limit(1);

    if (tableError) {
      if (tableError.code === '42P01') {
        console.log('❌ Table "document_folders" does not exist');
        console.log('\n📝 To create the table, run the following migration:');
        console.log('   1. Go to your Supabase project dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Copy and paste the content from:');
        console.log('      supabase/migrations/20250131_create_document_folders.sql');
        console.log('   4. Execute the SQL');
        return false;
      } else {
        console.error('❌ Error checking table:', tableError.message);
        return false;
      }
    }

    console.log('✅ Table "document_folders" exists');

    // Check table structure by attempting to select all columns
    try {
      const { data: testData } = await supabase
        .from('document_folders')
        .select('*')
        .limit(0);
      
      console.log('\n📊 Table structure verified - all required columns present');
    } catch (err) {
      console.log('\n⚠️  Could not verify table structure');
    }

    // Check if folder_id column exists in documents table
    const { data: docTest, error: docError } = await supabase
      .from('documents')
      .select('folder_id')
      .limit(0);

    if (docError && docError.message.includes('folder_id')) {
      console.log('\n⚠️  Column "folder_id" not found in documents table');
      console.log('   Run the migration to add this column');
      return false;
    }

    console.log('✅ Column "folder_id" exists in documents table');

    // Count existing folders
    const { count: folderCount } = await supabase
      .from('document_folders')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📁 Total document folders: ${folderCount || 0}`);

    // Count documents in folders
    const { data: docsInFolders } = await supabase
      .from('documents')
      .select('folder_id')
      .not('folder_id', 'is', null);

    console.log(`📄 Documents organized in folders: ${docsInFolders?.length || 0}`);

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

// Run the check
checkDocumentFolders().then(success => {
  if (success) {
    console.log('\n✨ Document folders system is ready to use!');
  } else {
    console.log('\n⚠️  Document folders system needs setup');
    console.log('\n📚 Quick fix:');
    console.log('   node scripts/apply-document-folders-migration.js');
  }
  process.exit(success ? 0 : 1);
});
