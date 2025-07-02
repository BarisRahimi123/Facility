const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ahntaamtsypranvnofxy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnRhYW10c3lwcmFudm5vZnh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU4MzQ4MCwiZXhwIjoyMDU1MTU5NDgwfQ.V9bSB1IhTI00AcqVDKL8PJgCrFNc0alnEGOMxMJaCoM'
);

async function checkPhotosSetup() {
  console.log('=== CHECKING PHOTOS SETUP ===\n');
  
  // Check if building_photos table exists
  console.log('1. Checking if building_photos table exists...');
  try {
    const { data, error } = await supabase.from('building_photos').select('*').limit(1);
    if (error) {
      console.log('❌ building_photos table does not exist:', error.message);
      console.log('💡 Need to apply the migration first\n');
    } else {
      console.log('✅ building_photos table exists\n');
    }
  } catch (err) {
    console.log('❌ Error checking table:', err.message);
  }
  
  // Check if building-photos storage bucket exists
  console.log('2. Checking if building-photos storage bucket exists...');
  try {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
      console.log('❌ Error checking buckets:', error.message);
    } else {
      const photoBucket = data.find(bucket => bucket.id === 'building-photos');
      if (photoBucket) {
        console.log('✅ building-photos bucket exists');
        console.log('   Bucket details:', photoBucket);
      } else {
        console.log('❌ building-photos bucket does not exist');
        console.log('   Available buckets:', data.map(b => b.id));
        console.log('   💡 Need to create the bucket manually in Supabase dashboard');
      }
    }
  } catch (err) {
    console.log('❌ Error checking buckets:', err.message);
  }
  
  console.log('\n=== SETUP RECOMMENDATIONS ===');
  console.log('If table is missing: Apply migration using Supabase CLI or dashboard');
  console.log('If bucket is missing: Create "building-photos" bucket in Supabase Storage');
  console.log('Bucket should be public for photo viewing');
}

checkPhotosSetup().then(() => process.exit(0)); 