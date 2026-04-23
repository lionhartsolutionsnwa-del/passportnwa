-- Passport NWA — schema v6 (run after schema_v5.sql)
-- Two-tier reward model: stamps are free on tap, points come only from approved receipts.

-- 1) Stop auto-awarding points on check-in. Stamps are free collectibles.
drop trigger if exists on_checkin_created on public.checkins;
alter table public.checkins alter column points_awarded set default 0;
-- (existing rows keep their old points_awarded — fine, no retroactive change)

-- 2) Receipts table
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  checkin_id uuid references public.checkins(id) on delete set null,
  photo_url text not null,
  amount_cents integer,
  points_awarded integer not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);

create index if not exists receipts_user_idx      on public.receipts(user_id, created_at desc);
create index if not exists receipts_pending_idx   on public.receipts(restaurant_id, status, created_at desc);

alter table public.receipts enable row level security;

drop policy if exists "receipts read" on public.receipts;
create policy "receipts read" on public.receipts for select using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  or exists (
    select 1 from public.restaurant_owners ro
    where ro.user_id = auth.uid() and ro.restaurant_id = receipts.restaurant_id
  )
);

drop policy if exists "receipts insert own" on public.receipts;
create policy "receipts insert own" on public.receipts for insert with check (auth.uid() = user_id);

drop policy if exists "receipts review" on public.receipts;
create policy "receipts review" on public.receipts for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  or exists (
    select 1 from public.restaurant_owners ro
    where ro.user_id = auth.uid() and ro.restaurant_id = receipts.restaurant_id
  )
);

-- 3) Award / revoke points when a receipt review decision is saved
create or replace function public.award_receipt_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    update public.profiles
       set points = points + coalesce(new.points_awarded, 0)
     where id = new.user_id;
  elsif old.status = 'approved' and new.status <> 'approved' then
    update public.profiles
       set points = greatest(0, points - coalesce(old.points_awarded, 0))
     where id = old.user_id;
  end if;
  return new;
end; $$;

drop trigger if exists on_receipt_reviewed on public.receipts;
create trigger on_receipt_reviewed
  after update on public.receipts
  for each row execute function public.award_receipt_points();
