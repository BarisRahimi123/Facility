const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ahntaamtsypranvnofxy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnRhYW10c3lwcmFudm5vZnh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU4MzQ4MCwiZXhwIjoyMDU1MTU5NDgwfQ.V9bSB1IhTI00AcqVDKL8PJgCrFNc0alnEGOMxMJaCoM'
);

async function setupPhotos() {
  console.log('=== SETTING UP PHOTOS FEATURE ===\n');
  
  // Step 1: Create the database table
  console.log('1. Creating building_photos table...');
  try {
    const { error: createError } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS public.building_photos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `;
    
    if (createError) {
      console.log('❌ Error creating table:', createError.message);
    } else {
      console.log('✅ Table created successfully');
    }
  } catch (error) {
    console.log('❌ Error in table creation:', error.message);
  }

  // Step 2: Enable RLS and create policies
  console.log('\n2. Setting up Row Level Security...');
  try {
    await supabase.sql`ALTER TABLE public.building_photos ENABLE ROW LEVEL SECURITY;`;
    
    await supabase.sql`
      CREATE POLICY IF NOT EXISTS "Building photos are viewable by everyone"
        ON public.building_photos FOR SELECT
        USING (true);
    `;
    
    await supabase.sql`
      CREATE POLICY IF NOT EXISTS "Building photos are insertable by authenticated users"
        ON public.building_photos FOR INSERT
        WITH CHECK (true);
    `;
    
    await supabase.sql`
      CREATE POLICY IF NOT EXISTS "Building photos are updatable by authenticated users"
        ON public.building_photos FOR UPDATE
        USING (true);
    `;
    
    await supabase.sql`
      CREATE POLICY IF NOT EXISTS "Building photos are deletable by authenticated users"
        ON public.building_photos FOR DELETE
        USING (true);
    `;
    
    console.log('✅ RLS policies created successfully');
  } catch (error) {
    console.log('❌ Error setting up RLS:', error.message);
  }

  // Step 3: Create indexes
  console.log('\n3. Creating indexes...');
  try {
    await supabase.sql`
      CREATE INDEX IF NOT EXISTS idx_building_photos_building_id 
      ON public.building_photos(building_id);
    `;
    
    await supabase.sql`
      CREATE INDEX IF NOT EXISTS idx_building_photos_created_at 
      ON public.building_photos(created_at DESC);
    `;
    
    console.log('✅ Indexes created successfully');
  } catch (error) {
    console.log('❌ Error creating indexes:', error.message);
  }

  // Step 4: Create storage bucket
  console.log('\n4. Creating storage bucket...');
  try {
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('building-photos', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
      } else {
        console.log('❌ Error creating bucket:', bucketError.message);
      }
    } else {
      console.log('✅ Bucket created successfully');
    }
  } catch (error) {
    console.log('❌ Error in bucket creation:', error.message);
  }

  // Step 5: Verify setup
  console.log('\n5. Verifying setup...');
  try {
    // Test table
    const { data: tableTest, error: tableError } = await supabase
      .from('building_photos')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table verification failed:', tableError.message);
    } else {
      console.log('✅ Table is working correctly');
    }

    // Test bucket
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.log('❌ Bucket verification failed:', bucketsError.message);
    } else {
      const photoBucket = buckets.find(bucket => bucket.id === 'building-photos');
      if (photoBucket) {
        console.log('✅ Storage bucket is accessible');
      } else {
        console.log('❌ Storage bucket not found');
      }
    }
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
  }

  console.log('\n=== SETUP COMPLETE ===');
  console.log('The photos feature should now be working!');
  console.log('You can now upload and view photos in the building detail pages.');
}

setupPhotos().then(() => process.exit(0)); 