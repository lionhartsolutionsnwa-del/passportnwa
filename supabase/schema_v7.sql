-- Passport NWA — schema v7 (run after schema_v6.sql)
-- Per-restaurant rewards + redemption flow.

-- 1) Rewards — a restaurant owner defines items customers can spend points on
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  points_cost integer not null check (points_cost > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists rewards_restaurant_idx on public.rewards(restaurant_id, is_active, sort_order);

alter table public.rewards enable row level security;

drop policy if exists "rewards read"           on public.rewards;
drop policy if exists "rewards write owner"    on public.rewards;
drop policy if exists "rewards update owner"   on public.rewards;
drop policy if exists "rewards delete owner"   on public.rewards;

create policy "rewards read" on public.rewards for select using (true);

create policy "rewards write owner" on public.rewards for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  or exists (
    select 1 from public.restaurant_owners ro
    where ro.user_id = auth.uid() and ro.restaurant_id = rewards.restaurant_id
  )
);

create policy "rewards update owner" on public.rewards for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  or exists (
    select 1 from public.restaurant_owners ro
    where ro.user_id = auth.uid() and ro.restaurant_id = rewards.restaurant_id
  )
);

create policy "rewards delete owner" on public.rewards for delete using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  or exists (
    select 1 from public.restaurant_owners ro
    where ro.user_id = auth.uid() and ro.restaurant_id = rewards.restaurant_id
  )
);

-- 2) Redemptions — a user spending points against a reward
create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  points_spent integer not null,
  reward_name text not null,
  code text not null,
  status text not null default 'pending' check (status in ('pending','fulfilled','cancelled')),
  fulfilled_by uuid references public.profiles(id) on delete set null,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists redemptions_code_idx on public.redemptions(code) where status = 'pending';
create index if not exists redemptions_user_idx  on public.redemptions(user_id, created_at desc);
create index if not exists redemptions_rest_idx  on public.redemptions(restaurant_id, status, created_at desc);

alter table public.redemptions enable row level security;

drop policy if exists "redemptions read"           on public.redemptions;
drop policy if exists "redemptions update owner"   on public.redemptions;
create policy "redemptions read" on public.redemptions for select using (
  auth.uid() = user_id
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  or exists (
    select 1 from public.restaurant_owners ro
    where ro.user_id = auth.uid() and ro.restaurant_id = redemptions.restaurant_id
  )
);

create policy "redemptions update owner" on public.redemptions for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  or exists (
    select 1 from public.restaurant_owners ro
    where ro.user_id = auth.uid() and ro.restaurant_id = redemptions.restaurant_id
  )
);

-- 3) Atomic redeem function — checks balance, deducts points, creates redemption
create or replace function public.redeem_reward(p_reward_id uuid)
returns public.redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reward    public.rewards;
  v_profile   public.profiles;
  v_code      text;
  v_try       integer := 0;
  v_red       public.redemptions;
  v_uid       uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_reward from public.rewards where id = p_reward_id and is_active;
  if not found then
    raise exception 'reward not available';
  end if;

  select * into v_profile from public.profiles where id = v_uid for update;
  if v_profile.points < v_reward.points_cost then
    raise exception 'insufficient points';
  end if;

  -- Generate a unique 6-char code, retry on collision
  loop
    v_try := v_try + 1;
    v_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    begin
      insert into public.redemptions (
        user_id, reward_id, restaurant_id, points_spent, reward_name, code, status
      ) values (
        v_uid, v_reward.id, v_reward.restaurant_id, v_reward.points_cost, v_reward.name, v_code, 'pending'
      )
      returning * into v_red;
      exit;
    exception when unique_violation then
      if v_try > 10 then raise exception 'could not generate redemption code'; end if;
    end;
  end loop;

  update public.profiles
     set points = points - v_reward.points_cost
   where id = v_uid;

  return v_red;
end; $$;

grant execute on function public.redeem_reward(uuid) to authenticated;

-- 4) Refund points on cancel. Fulfill doesn't refund.
create or replace function public.handle_redemption_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'pending' and new.status = 'cancelled' then
    update public.profiles
       set points = points + old.points_spent
     where id = old.user_id;
  end if;
  return new;
end; $$;

drop trigger if exists on_redemption_status on public.redemptions;
create trigger on_redemption_status
  after update on public.redemptions
  for each row execute function public.handle_redemption_status_change();
