-- Passport NWA — schema v12 (run after schema_v11.sql)
-- Notifications + per-user restaurant ratings.

-- Notifications inbox
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link_url text,
  related_restaurant_id uuid references public.restaurants(id) on delete set null,
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_inbox_idx
  on public.notifications(user_id, dismissed_at, read_at, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications read own"   on public.notifications;
drop policy if exists "notifications update own" on public.notifications;
drop policy if exists "notifications delete own" on public.notifications;

create policy "notifications read own"   on public.notifications for select using (auth.uid() = user_id);
create policy "notifications update own" on public.notifications for update using (auth.uid() = user_id);
create policy "notifications delete own" on public.notifications for delete using (auth.uid() = user_id);

-- Per-user restaurant ratings (1-5)
create table if not exists public.restaurant_ratings (
  user_id       uuid not null references public.profiles(id)    on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

create index if not exists restaurant_ratings_restaurant_idx on public.restaurant_ratings(restaurant_id);
create index if not exists restaurant_ratings_user_idx       on public.restaurant_ratings(user_id, updated_at desc);

alter table public.restaurant_ratings enable row level security;

drop policy if exists "ratings read"        on public.restaurant_ratings;
drop policy if exists "ratings insert own"  on public.restaurant_ratings;
drop policy if exists "ratings update own"  on public.restaurant_ratings;
drop policy if exists "ratings delete own"  on public.restaurant_ratings;

create policy "ratings read"       on public.restaurant_ratings for select using (true);
create policy "ratings insert own" on public.restaurant_ratings for insert with check (auth.uid() = user_id);
create policy "ratings update own" on public.restaurant_ratings for update using (auth.uid() = user_id);
create policy "ratings delete own" on public.restaurant_ratings for delete using (auth.uid() = user_id);

-- Auto-bump updated_at on rating edits
create or replace function public.touch_rating_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists on_rating_update on public.restaurant_ratings;
create trigger on_rating_update
  before update on public.restaurant_ratings
  for each row execute function public.touch_rating_updated_at();
