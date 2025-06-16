const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testStorage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Testing Supabase Storage...\n');

  try {
    // 1. List buckets
    console.log('1. Listing buckets:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('Buckets found:', buckets.map(b => b.name));
    
    // 2. Check documents bucket
    const documentsBucket = buckets.find(b => b.name === 'documents');
    if (documentsBucket) {
      console.log('\n2. Documents bucket details:');
      console.log('- ID:', documentsBucket.id);
      console.log('- Name:', documentsBucket.name);
      console.log('- Public:', documentsBucket.public);
      console.log('- Created at:', documentsBucket.created_at);
      console.log('- File size limit:', documentsBucket.file_size_limit);
      console.log('- Allowed MIME types:', documentsBucket.allowed_mime_types);
    } else {
      console.log('\n❌ Documents bucket not found!');
      return;
    }

    // 3. Test upload
    console.log('\n3. Testing file upload...');
    const testContent = 'This is a test file for storage verification.';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    const testFileName = `test/storage-test-${Date.now()}.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(testFileName, testFile);

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      
      // Check if it's a policy error
      if (uploadError.message.includes('policy')) {
        console.log('\n⚠️  Storage policy issue detected!');
        console.log('The bucket may need proper RLS policies or public access configuration.');
      }
    } else {
      console.log('✅ Upload successful!');
      console.log('- Path:', uploadData.path);
      
      // 4. Test public URL
      console.log('\n4. Getting public URL...');
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(testFileName);
      
      console.log('Public URL:', urlData.publicUrl);
      
      // 5. Test download
      console.log('\n5. Testing download...');
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(testFileName);
      
      if (downloadError) {
        console.error('❌ Download failed:', downloadError);
      } else {
        console.log('✅ Download successful!');
        const text = await downloadData.text();
        console.log('- Content matches:', text === testContent);
      }
      
      // 6. Clean up
      console.log('\n6. Cleaning up test file...');
      const { error: deleteError } = await supabase.storage
        .from('documents')
        .remove([testFileName]);
      
      if (deleteError) {
        console.error('❌ Delete failed:', deleteError);
      } else {
        console.log('✅ Test file deleted successfully!');
      }
    }

    // 7. Check bucket policies
    console.log('\n7. Checking bucket configuration...');
    console.log('Note: To ensure public access, the bucket should have:');
    console.log('- public: true');
    console.log('- Appropriate RLS policies (or RLS disabled for public buckets)');
    console.log('- Correct CORS settings if accessed from browser');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testStorage(); 