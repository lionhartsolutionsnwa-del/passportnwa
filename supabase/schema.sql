-- Passport NWA — database schema
-- Run this in Supabase → SQL Editor → New query → paste → Run

-- =====================================================================
-- PROFILES — one row per user (linked to auth.users)
-- =====================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  points integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- RESTAURANTS
-- =====================================================================
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  city text not null,
  address text,
  cuisine text,
  cover_image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- CHECK-INS — the "passport stamp"
-- =====================================================================
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  points_awarded integer not null default 10,
  created_at timestamptz not null default now()
);

create index if not exists checkins_user_idx on public.checkins(user_id, created_at desc);
create index if not exists checkins_restaurant_idx on public.checkins(restaurant_id, created_at desc);

-- Award points to the profile when a check-in is created
create or replace function public.award_points_on_checkin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set points = points + new.points_awarded
   where id = new.user_id;
  return new;
end; $$;

drop trigger if exists on_checkin_created on public.checkins;
create trigger on_checkin_created
  after insert on public.checkins
  for each row execute function public.award_points_on_checkin();

-- =====================================================================
-- POSTS — social feed entries
-- =====================================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  checkin_id uuid references public.checkins(id) on delete set null,
  caption text,
  photo_url text,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists posts_user_idx on public.posts(user_id, created_at desc);

-- =====================================================================
-- FOLLOWS
-- =====================================================================
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- =====================================================================
-- LIKES
-- =====================================================================
create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles    enable row level security;
alter table public.restaurants enable row level security;
alter table public.checkins    enable row level security;
alter table public.posts       enable row level security;
alter table public.follows     enable row level security;
alter table public.likes       enable row level security;

-- Profiles: everyone can read, only the owner can update their own row
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Restaurants: everyone can read active rows
drop policy if exists "restaurants read" on public.restaurants;
create policy "restaurants read" on public.restaurants for select using (is_active = true);

-- Check-ins: everyone can read, only the user can create their own
drop policy if exists "checkins read" on public.checkins;
create policy "checkins read" on public.checkins for select using (true);
drop policy if exists "checkins insert own" on public.checkins;
create policy "checkins insert own" on public.checkins for insert
  with check (auth.uid() = user_id);

-- Posts: everyone can read, only the author can create/delete their own
drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using (true);
drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert with check (auth.uid() = user_id);
drop policy if exists "posts delete own" on public.posts;
create policy "posts delete own" on public.posts for delete using (auth.uid() = user_id);

-- Follows: everyone can read, only create/delete your own follows
drop policy if exists "follows read" on public.follows;
create policy "follows read" on public.follows for select using (true);
drop policy if exists "follows insert own" on public.follows;
create policy "follows insert own" on public.follows for insert with check (auth.uid() = follower_id);
drop policy if exists "follows delete own" on public.follows;
create policy "follows delete own" on public.follows for delete using (auth.uid() = follower_id);

-- Likes: everyone can read, only create/delete your own
drop policy if exists "likes read" on public.likes;
create policy "likes read" on public.likes for select using (true);
drop policy if exists "likes insert own" on public.likes;
create policy "likes insert own" on public.likes for insert with check (auth.uid() = user_id);
drop policy if exists "likes delete own" on public.likes;
create policy "likes delete own" on public.likes for delete using (auth.uid() = user_id);

-- =====================================================================
-- SEED RESTAURANTS
-- =====================================================================
insert into public.restaurants (slug, name, description, city, cuisine) values
  ('the-hive',        'The Hive',         'Ozark-inspired cuisine inside 21c Museum Hotel.', 'Bentonville',  'New American'),
  ('oven-and-tap',    'Oven & Tap',       'Wood-fired pizza and craft beer on the Bentonville square.', 'Bentonville',  'Pizza & Craft Beer'),
  ('preachers-son',   'The Preacher''s Son', 'Modern American fine dining in a restored church.',      'Bentonville',  'Fine Dining'),
  ('conifer',         'Conifer',          'Seasonal tasting menu from chef Matthew McClure.',           'Bentonville',  'Tasting Menu'),
  ('tusk-and-trotter','Tusk & Trotter',   'Southern high cotton — nose-to-tail cooking.',               'Bentonville',  'Southern'),
  ('atlas',           'Atlas',            'Globally-inspired small plates and natural wine.',           'Fayetteville', 'Small Plates'),
  ('brightwater',     'Brightwater',      'Farm-to-table lunch from the culinary school.',              'Bentonville',  'Farm-to-Table')
on conflict (slug) do nothing;
