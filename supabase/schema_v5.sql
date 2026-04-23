-- Passport NWA — schema v5 (run after schema_v4.sql)
-- Adds per-restaurant check-in tokens so only QR-code scans can stamp a passport.

alter table public.restaurants
  add column if not exists check_in_token uuid not null default gen_random_uuid();

-- Populate any existing rows that were created before the default was added
update public.restaurants
  set check_in_token = gen_random_uuid()
  where check_in_token is null;

create unique index if not exists restaurants_check_in_token_idx on public.restaurants (check_in_token);
