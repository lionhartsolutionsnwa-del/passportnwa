-- Storage policies for the 'receipts' bucket.
-- Create bucket 'receipts' in Supabase → Storage (Public OFF — receipts are private).

-- Read: uploader, admin, or restaurant owner
drop policy if exists "receipts read" on storage.objects;
create policy "receipts read" on storage.objects for select to authenticated using (
  bucket_id = 'receipts'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
    or exists (select 1 from public.restaurant_owners ro where ro.user_id = auth.uid())
  )
);

-- Upload to own folder only: receipts/<user-id>/<file>
drop policy if exists "receipts upload own" on storage.objects;
create policy "receipts upload own" on storage.objects for insert to authenticated with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);
