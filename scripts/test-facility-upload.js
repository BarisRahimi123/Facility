const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testFacilityUpload() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Testing facility document upload...\n');

  try {
    // 1. Get a facility ID
    console.log('1. Getting Kabul facility...');
    const { data: facilities, error: facilityError } = await supabase
      .from('facilities')
      .select('id, name')
      .eq('name', 'Kabul')
      .single();

    if (facilityError || !facilities) {
      console.error('Error getting facility:', facilityError);
      return;
    }

    console.log('Found facility:', facilities.name, 'ID:', facilities.id);

    // 2. Test file upload
    console.log('\n2. Uploading test document...');
    const testContent = 'This is a test document for facility upload verification.';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const fileName = `facilities/${facilities.id}/${Date.now()}-test-document.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, testFile);

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      return;
    }

    console.log('✅ File uploaded successfully!');
    console.log('- Path:', uploadData.path);

    // 3. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    console.log('- Public URL:', publicUrl);

    // 4. Save document metadata
    console.log('\n3. Saving document metadata...');
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        facility_id: facilities.id,
        name: 'Test Facility Document',
        file_name: 'test-document.txt',
        file_size: testFile.size,
        file_type: 'text/plain',
        file_url: publicUrl,
        description: 'Test document for facility upload',
        category: 'General',
        tags: ['test', 'facility'],
        uploaded_by: null
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ Error saving document metadata:', docError);
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([fileName]);
      return;
    }

    console.log('✅ Document metadata saved!');
    console.log('- Document ID:', docData.id);
    console.log('- Facility ID:', docData.facility_id);

    // 5. Verify we can retrieve the document
    console.log('\n4. Verifying document retrieval...');
    const { data: retrievedDoc, error: retrieveError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single();

    if (retrieveError) {
      console.error('❌ Error retrieving document:', retrieveError);
    } else {
      console.log('✅ Document retrieved successfully!');
      console.log('- Name:', retrievedDoc.name);
      console.log('- Facility ID:', retrievedDoc.facility_id);
      console.log('- Building ID:', retrievedDoc.building_id);
    }

    // 6. Clean up
    console.log('\n5. Cleaning up test data...');
    
    // Delete document record
    const { error: deleteDocError } = await supabase
      .from('documents')
      .delete()
      .eq('id', docData.id);

    if (deleteDocError) {
      console.error('❌ Error deleting document record:', deleteDocError);
    }

    // Delete file from storage
    const { error: deleteFileError } = await supabase.storage
      .from('documents')
      .remove([fileName]);

    if (deleteFileError) {
      console.error('❌ Error deleting file:', deleteFileError);
    } else {
      console.log('✅ Test data cleaned up successfully!');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testFacilityUpload(); 