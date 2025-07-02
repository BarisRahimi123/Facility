const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ahntaamtsypranvnofxy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnRhYW10c3lwcmFudm5vZnh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU4MzQ4MCwiZXhwIjoyMDU1MTU5NDgwfQ.V9bSB1IhTI00AcqVDKL8PJgCrFNc0alnEGOMxMJaCoM'
);

async function createFieldsTable() {
  console.log('=== CREATING FIELDS TABLE ===\n');
  
  try {
    // First, check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('fields')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Fields table already exists');
      return;
    }
    
    console.log('📦 Creating fields table...');
    console.log('⚠️ Since table does not exist, you need to apply the migration manually:');
    console.log('1. Go to https://supabase.com/dashboard/project/ahntaamtsypranvnofxy');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the migration from: supabase/migrations/20250117_create_fields_and_reservations_tables.sql');
    console.log('4. Run the migration');
    console.log('');
    console.log('OR simply create a test field to verify the table exists...');
    
    // Try to create a test field to see if server actions work
    console.log('🧪 Testing field creation...');
    
    // Import the server action (this won't work in Node.js, just for demo)
    console.log('Note: Run this from the app to test field creation');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createFieldsTable().catch(console.error); 