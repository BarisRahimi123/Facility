const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function setupFieldStorage() {
  // Create Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Setting up field storage buckets...');

  try {
    // Check if field-images bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    console.log('Existing buckets:', buckets.map(b => b.name));

    const fieldImagesBucketExists = buckets.some(bucket => bucket.name === 'field-images');
    const aerialImagesBucketExists = buckets.some(bucket => bucket.name === 'aerial-images');

    // Create field-images bucket if it doesn't exist
    if (!fieldImagesBucketExists) {
      console.log('Creating field-images bucket...');
      const { data: fieldBucket, error: fieldError } = await supabase.storage.createBucket('field-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (fieldError) {
        console.error('Error creating field-images bucket:', fieldError);
      } else {
        console.log('✅ field-images bucket created successfully');
      }
    } else {
      console.log('✅ field-images bucket already exists');
    }

    // Create aerial-images bucket if it doesn't exist
    if (!aerialImagesBucketExists) {
      console.log('Creating aerial-images bucket...');
      const { data: aerialBucket, error: aerialError } = await supabase.storage.createBucket('aerial-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff'],
        fileSizeLimit: 52428800 // 50MB for aerial images
      });

      if (aerialError) {
        console.error('Error creating aerial-images bucket:', aerialError);
      } else {
        console.log('✅ aerial-images bucket created successfully');
      }
    } else {
      console.log('✅ aerial-images bucket already exists');
    }

    // Test upload to verify bucket permissions
    console.log('\nTesting bucket permissions...');
    
    // Create a small test file
    const testFileContent = Buffer.from('test image content');
    const testFileName = `test-${Date.now()}.txt`;

    // Test field-images bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('field-images')
      .upload(`test/${testFileName}`, testFileContent);

    if (uploadError) {
      console.error('❌ field-images bucket upload test failed:', uploadError);
    } else {
      console.log('✅ field-images bucket upload test successful');
      
      // Clean up test file
      await supabase.storage.from('field-images').remove([`test/${testFileName}`]);
    }

    // Test aerial-images bucket
    const { data: aerialUploadData, error: aerialUploadError } = await supabase.storage
      .from('aerial-images')
      .upload(`test/${testFileName}`, testFileContent);

    if (aerialUploadError) {
      console.error('❌ aerial-images bucket upload test failed:', aerialUploadError);
    } else {
      console.log('✅ aerial-images bucket upload test successful');
      
      // Clean up test file
      await supabase.storage.from('aerial-images').remove([`test/${testFileName}`]);
    }

    console.log('\n✅ Field storage setup complete!');
    console.log('\nYou can now upload images to fields through the Edit Field modal.');

  } catch (error) {
    console.error('Error setting up field storage:', error);
  }
}

// Run the setup
setupFieldStorage().catch(console.error); 