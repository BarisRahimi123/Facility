const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkFacilityPhotosTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Please check your .env.local file for:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🔍 Checking if facility_photos table exists...');
    
    // Try to query the table
    const { data, error } = await supabase
      .from('facility_photos')
      .select('count(*)')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('❌ facility_photos table does not exist!');
        console.log('');
        console.log('🔧 To fix this, run the following SQL in your Supabase SQL Editor:');
        console.log('');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of:');
        console.log('   supabase/migrations/20250115_create_facility_photos_table.sql');
        console.log('4. Execute the SQL commands');
        console.log('');
        console.log('This will create the facility_photos table and storage bucket.');
        return;
      } else {
        console.error('❌ Error checking table:', error);
        return;
      }
    }

    console.log('✅ facility_photos table exists!');
    console.log(`📊 Table can be queried successfully`);
    
    // Check storage bucket
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error checking storage buckets:', bucketError);
      return;
    }

    const facilityPhotosBucket = buckets.find(bucket => bucket.id === 'facility-photos');
    
    if (facilityPhotosBucket) {
      console.log('✅ facility-photos storage bucket exists!');
    } else {
      console.log('❌ facility-photos storage bucket does not exist!');
      console.log('The migration needs to be applied to create the storage bucket.');
    }
    
    console.log('');
    console.log('🎉 Facility photos functionality should work correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkFacilityPhotosTable();
