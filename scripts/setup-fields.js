const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ahntaamtsypranvnofxy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnRhYW10c3lwcmFudm5vZnh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU4MzQ4MCwiZXhwIjoyMDU1MTU5NDgwfQ.V9bSB1IhTI00AcqVDKL8PJgCrFNc0alnEGOMxMJaCoM'
);

async function setupFields() {
  console.log('=== SETTING UP FIELDS TABLE ===\n');
  
  try {
    // Check if fields table exists by trying to query it
    console.log('1. Checking if fields table exists...');
    const { data: existingFields, error: checkError } = await supabase
      .from('fields')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Fields table already exists');
      console.log('Fields found:', existingFields?.length || 0);
    } else if (checkError.message.includes('does not exist')) {
      console.log('❌ Fields table does not exist');
      console.log('📖 You need to apply the migration manually:');
      console.log('');
      console.log('🔧 SETUP INSTRUCTIONS:');
      console.log('1. Go to: https://supabase.com/dashboard/project/ahntaamtsypranvnofxy');
      console.log('2. Click "SQL Editor" in the left sidebar');
      console.log('3. Click "New query"');
      console.log('4. Copy the entire contents of: supabase/migrations/20250117_create_fields_and_reservations_tables.sql');
      console.log('5. Paste into the SQL editor');
      console.log('6. Click "Run" to execute');
      console.log('');
      console.log('Then run this script again to test.');
      return;
    } else {
      console.error('Unexpected error checking fields table:', checkError);
      return;
    }
    
    // Test creating a field
    console.log('\n2. Testing field creation...');
    
    // Get a facility ID to test with
    const { data: facilities } = await supabase
      .from('facilities')
      .select('id, name')
      .limit(1);
    
    if (!facilities || facilities.length === 0) {
      console.log('❌ No facilities found to test with');
      return;
    }
    
    const facilityId = facilities[0].id;
    console.log(`Using facility: ${facilities[0].name} (${facilityId})`);
    
    // Create a test field
    const testField = {
      facility_id: facilityId,
      name: 'Test Soccer Field',
      type: 'soccer',
      surface_type: 'natural_grass',
      dimensions: '100x60 yards',
      area_sq_ft: 6000,
      capacity: 22,
      hourly_rate: 50.00,
      daily_rate: 300.00,
      ada_compliant: true,
      has_lighting: true,
      has_parking: true,
      parking_spots: 50,
      instant_booking: true,
      requires_approval: false,
      description: 'Test field created by setup script'
    };
    
    const { data: newField, error: createError } = await supabase
      .from('fields')
      .insert(testField)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating test field:', createError);
    } else {
      console.log('✅ Test field created successfully!');
      console.log('Field ID:', newField.id);
      console.log('Field Name:', newField.name);
      
      // Clean up - delete the test field
      console.log('\n3. Cleaning up test field...');
      const { error: deleteError } = await supabase
        .from('fields')
        .delete()
        .eq('id', newField.id);
      
      if (deleteError) {
        console.error('❌ Error deleting test field:', deleteError);
      } else {
        console.log('✅ Test field deleted successfully');
      }
    }
    
    console.log('\n🎉 Fields setup verification complete!');
    console.log('You can now create fields through the UI.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupFields().catch(console.error); 