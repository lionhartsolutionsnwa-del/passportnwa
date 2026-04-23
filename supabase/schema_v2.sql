-- Passport NWA — schema v2 additions (run AFTER schema.sql)
-- Adds: profile flags, post_tags, restaurant_owners, restaurant_claims

-- =====================================================================
-- PROFILE FLAGS
-- =====================================================================
alter table public.profiles add column if not exists is_restaurant_owner boolean not null default false;
alter table public.profiles add column if not exists followers_count integer not null default 0;
alter table public.profiles add column if not exists following_count integer not null default 0;

-- Keep follower / following counts in sync via triggers
create or replace function public.handle_follow_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set followers_count = followers_count + 1 where id = new.followee_id;
  update public.profiles set following_count = following_count + 1 where id = new.follower_id;
  return new;
end; $$;

create or replace function public.handle_follow_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set followers_count = greatest(0, followers_count - 1) where id = old.followee_id;
  update public.profiles set following_count = greatest(0, following_count - 1) where id = old.follower_id;
  return old;
end; $$;

drop trigger if exists on_follow_insert on public.follows;
create trigger on_follow_insert after insert on public.follows
  for each row execute function public.handle_follow_insert();

drop trigger if exists on_follow_delete on public.follows;
create trigger on_follow_delete after delete on public.follows
  for each row execute function public.handle_follow_delete();

-- =====================================================================
-- POST TAGS — @username mentions
-- =====================================================================
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tagged_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, tagged_user_id)
);

create index if not exists post_tags_user_idx on public.post_tags(tagged_user_id, created_at desc);

alter table public.post_tags enable row level security;
drop policy if exists "post_tags read" on public.post_tags;
create policy "post_tags read" on public.post_tags for select using (true);
drop policy if exists "post_tags insert by author" on public.post_tags;
create policy "post_tags insert by author" on public.post_tags for insert
  with check (exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));

-- =====================================================================
-- RESTAURANT OWNERSHIP — approved owners linked to restaurants
-- =====================================================================
create table if not exists public.restaurant_owners (
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  approved_at timestamptz not null default now(),
  approved_by uuid references public.profiles(id) on delete set null,
  primary key (user_id, restaurant_id)
);

alter table public.restaurant_owners enable row level security;
drop policy if exists "owners read" on public.restaurant_owners;
create policy "owners read" on public.restaurant_owners for select using (true);

-- =====================================================================
-- RESTAURANT CLAIMS — owners request to claim a restaurant
-- =====================================================================
create table if not exists public.restaurant_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  role_at_restaurant text,
  contact_phone text,
  message text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, restaurant_id)
);

create index if not exists claims_pending_idx on public.restaurant_claims(status, created_at desc);

alter table public.restaurant_claims enable row level security;
drop policy if exists "claims read own or admin" on public.restaurant_claims;
create policy "claims read own or admin" on public.restaurant_claims for select
  using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
drop policy if exists "claims insert own" on public.restaurant_claims;
create policy "claims insert own" on public.restaurant_claims for insert
  with check (auth.uid() = user_id);

-- =====================================================================
-- RESTAURANT EXTRA FIELDS for Google Places import
-- =====================================================================
alter table public.restaurants add column if not exists google_place_id text unique;
alter table public.restaurants add column if not exists website text;
alter table public.restaurants add column if not exists phone text;
alter table public.restaurants add column if not exists lat double precision;
alter table public.restaurants add column if not exists lng double precision;

-- Allow admins to insert restaurants
drop policy if exists "restaurants insert admin" on public.restaurants;
create policy "restaurants insert admin" on public.restaurants for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
drop policy if exists "restaurants update admin" on public.restaurants;
create policy "restaurants update admin" on public.restaurants for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));
