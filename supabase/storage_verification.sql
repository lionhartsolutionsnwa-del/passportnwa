-- Storage policies for 'verification' bucket (create in Supabase UI as Public OFF).
-- All reads/writes go through admin client (service role) on the server,
-- so we only need a minimal read policy for authenticated users (their own docs).

drop policy if exists "verification read own" on storage.objects;
create policy "verification read own" on storage.objects for select to authenticated using (
  bucket_id = 'verification'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
);
