-- Passport NWA — storage policies for avatars + posts buckets
-- Run this in Supabase SQL Editor. Assumes buckets 'avatars' and 'posts' exist.

-- Anyone can read from these public buckets
drop policy if exists "avatars read"  on storage.objects;
drop policy if exists "posts read"    on storage.objects;
create policy "avatars read"  on storage.objects for select using (bucket_id = 'avatars');
create policy "posts read"    on storage.objects for select using (bucket_id = 'posts');

-- Authenticated users can upload to a folder named after their own user id:
--   avatars/<uid>/<file>
--   posts/<uid>/<file>
drop policy if exists "avatars upload own" on storage.objects;
create policy "avatars upload own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "posts upload own" on storage.objects;
create policy "posts upload own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "posts delete own" on storage.objects;
create policy "posts delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
