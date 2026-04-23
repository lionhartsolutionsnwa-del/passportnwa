-- Passport NWA — schema v9 (run after schema_v8.sql)
-- Admin tooling: announcements, featured, suspensions.

-- Announcements / broadcast banner on feed
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  link_url text,
  link_label text,
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists announcements_active_idx
  on public.announcements(is_active, starts_at desc);

alter table public.announcements enable row level security;

drop policy if exists "announcements read active" on public.announcements;
create policy "announcements read active" on public.announcements for select using (
  is_active = true
  and starts_at <= now()
  and (ends_at is null or ends_at > now())
);

drop policy if exists "announcements admin all" on public.announcements;
create policy "announcements admin all" on public.announcements for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
);

-- Featured restaurants
alter table public.restaurants add column if not exists is_featured boolean not null default false;
create index if not exists restaurants_featured_idx on public.restaurants(is_featured) where is_featured = true;

-- Suspended users
alter table public.profiles add column if not exists is_suspended boolean not null default false;
alter table public.profiles add column if not exists suspended_reason text;
alter table public.profiles add column if not exists suspended_at timestamptz;
