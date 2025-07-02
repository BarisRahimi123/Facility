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
  with check (auth.role() = 'authenticated');

create policy "Building photos are updatable by authenticated users"
  on public.building_photos for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Building photos are deletable by authenticated users"
  on public.building_photos for delete
  using (auth.role() = 'authenticated');

-- Create storage bucket for building photos
insert into storage.buckets (id, name, public)
values ('building-photos', 'building-photos', true)
on conflict (id) do nothing;

-- Add storage policies
create policy "Building photos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'building-photos');

create policy "Building photos are insertable by authenticated users"
  on storage.objects for insert
  with check (
    bucket_id = 'building-photos' 
    and auth.role() = 'authenticated'
  );

create policy "Building photos are updatable by authenticated users"
  on storage.objects for update
  using (
    bucket_id = 'building-photos'
    and auth.role() = 'authenticated'
  )
  with check (
    bucket_id = 'building-photos'
    and auth.role() = 'authenticated'
  );

create policy "Building photos are deletable by authenticated users"
  on storage.objects for delete
  using (
    bucket_id = 'building-photos'
    and auth.role() = 'authenticated'
  );

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_building_photos_updated_at
  before update on public.building_photos
  for each row
  execute function public.handle_updated_at(); 