-- supabase/create_storage_buckets.sql

-- 1. Create the 'promos' bucket (used for TV App Icons and Promos)
insert into storage.buckets (id, name, public) 
values ('promos', 'promos', true)
on conflict (id) do nothing;

-- 2. Create the 'hotel-assets' bucket (used for Dashboard Backgrounds)
insert into storage.buckets (id, name, public) 
values ('hotel-assets', 'hotel-assets', true)
on conflict (id) do nothing;

-- 3. Set Public Read Access Policies for 'promos'
create policy "Public access to promos"
on storage.objects for select
to public
using ( bucket_id = 'promos' );

-- 4. Set Service Role full access policies for 'promos'
create policy "Service Role full access promos"
on storage.objects for all
to service_role
using ( bucket_id = 'promos' );

-- 5. Set Public Read Access Policies for 'hotel-assets'
create policy "Public access to hotel-assets"
on storage.objects for select
to public
using ( bucket_id = 'hotel-assets' );

-- 6. Set Service Role full access policies for 'hotel-assets'
create policy "Service Role full access hotel-assets"
on storage.objects for all
to service_role
using ( bucket_id = 'hotel-assets' );
