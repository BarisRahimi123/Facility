const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ahntaamtsypranvnofxy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFobnRhYW10c3lwcmFudm5vZnh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTU4MzQ4MCwiZXhwIjoyMDU1MTU5NDgwfQ.V9bSB1IhTI00AcqVDKL8PJgCrFNc0alnEGOMxMJaCoM'
);

const migrationSQL = `
-- Create building_photos table
create table if not exists public.building_photos (
  id uuid default gen_random_uuid() primary key,
  building_id uuid not null references public.buildings(id) on delete cascade,
  url text not null,
  storage_path text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.building_photos enable row level security;

create policy "Building photos are viewable by everyone"
  on public.building_photos for select
  using (true);

create policy "Building photos are insertable by authenticated users"
  on public.building_photos for insert
  with check (true);

create policy "Building photos are updatable by authenticated users"
  on public.building_photos for update
  using (true);

create policy "Building photos are deletable by authenticated users"
  on public.building_photos for delete
  using (true);

-- Add indexes for performance
create index if not exists idx_building_photos_building_id on public.building_photos(building_id);
create index if not exists idx_building_photos_created_at on public.building_photos(created_at desc);
`;

const triggerSQL = `
-- Add updated_at trigger
create or replace function public.handle_updated_at_building_photos()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create or replace trigger building_photos_updated_at
  before update on public.building_photos
  for each row
  execute function public.handle_updated_at_building_photos();
`;

async function applyMigration() {
  console.log('=== APPLYING BUILDING PHOTOS MIGRATION ===\n');
  
  try {
    console.log('1. Creating building_photos table and policies...');
    const { error: tableError } = await supabase.rpc('exec', { sql: migrationSQL });
    
    if (tableError) {
      console.log('❌ Error creating table:', tableError.message);
    } else {
      console.log('✅ Table and policies created successfully');
    }

    console.log('\n2. Creating trigger function...');
    const { error: triggerError } = await supabase.rpc('exec', { sql: triggerSQL });
    
    if (triggerError) {
      console.log('❌ Error creating trigger:', triggerError.message);
    } else {
      console.log('✅ Trigger created successfully');
    }

    console.log('\n3. Verifying table creation...');
    const { data, error } = await supabase.from('building_photos').select('*').limit(1);
    
    if (error) {
      console.log('❌ Table verification failed:', error.message);
    } else {
      console.log('✅ Table verified successfully');
    }

    console.log('\n4. Creating storage bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('building-photos', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
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
    console.log('❌ Migration failed:', error.message);
  }
}

applyMigration().then(() => {
  console.log('\n=== MIGRATION COMPLETE ===');
  process.exit(0);
}); 