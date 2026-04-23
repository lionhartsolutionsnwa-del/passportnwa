-- Passport NWA — schema v4 (run after schema_v3.sql)
-- Adds favorite-restaurants pinning + relaxes profile updates.

alter table public.profiles
  add column if not exists favorite_restaurant_ids uuid[] not null default '{}';

-- Username uniqueness is already enforced; just ensure case-insensitive duplicates can't sneak in
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));

-- Allow users to upsert their own profile row (the trigger creates it on signup,
-- but legacy users without a row need to be able to insert via /settings).
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert
  with check (auth.uid() = id);
