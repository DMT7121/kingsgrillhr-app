-- =========================================================
-- KINGS GRILL HR WEBAPP: STORAGE BUCKETS & POLICIES
-- =========================================================
-- Run this in Supabase SQL Editor AFTER schema.sql and seed.sql

-- 1. Create buckets
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('documents', 'documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('attendance-photos', 'attendance-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('candidate-resumes', 'candidate-resumes', false)
on conflict (id) do nothing;

-- 2. Avatars Policies (Public read, Authenticated users can upload their own)
create policy "Avatars are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Users can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- 3. Documents Policies (Only authenticated users can read/write)
create policy "Authenticated users can read documents"
  on storage.objects for select
  using ( bucket_id = 'documents' and auth.role() = 'authenticated' );

create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check ( bucket_id = 'documents' and auth.role() = 'authenticated' );

create policy "Authenticated users can update documents"
  on storage.objects for update
  using ( bucket_id = 'documents' and auth.role() = 'authenticated' );

-- Note: In a production environment, you would want to restrict document access
-- so employees can only read/write their own documents, and HR can read all.
