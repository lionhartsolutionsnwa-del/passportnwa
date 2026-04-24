-- Passport NWA — schema v11 (run after schema_v10.sql)
-- Referral system: both inviter and invitee get +25 points when a valid referral
-- code is used at signup.

alter table public.profiles
  add column if not exists referred_by uuid references public.profiles(id) on delete set null,
  add column if not exists referral_bonus_granted_at timestamptz;

create index if not exists profiles_referred_by_idx on public.profiles(referred_by);

-- 1) Rewrite handle_new_user to resolve referral username → id
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ref_id uuid;
  v_ref_username text;
begin
  v_ref_username := new.raw_user_meta_data->>'referred_by_username';
  if v_ref_username is not null and v_ref_username <> '' then
    select id into v_ref_id from public.profiles where lower(username) = lower(v_ref_username);
  end if;

  insert into public.profiles (
    id, username, display_name, phone,
    email_marketing_consent, sms_marketing_consent, consent_updated_at,
    referred_by
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'email_marketing_consent')::boolean, false),
    coalesce((new.raw_user_meta_data->>'sms_marketing_consent')::boolean, false),
    now(),
    v_ref_id
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- 2) Award +25 to the new user on profile creation if they were referred
create or replace function public.apply_referral_self_bonus()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.referred_by is not null and new.referral_bonus_granted_at is null then
    new.points := coalesce(new.points, 0) + 25;
    new.referral_bonus_granted_at := now();
  end if;
  return new;
end; $$;

drop trigger if exists before_insert_referral on public.profiles;
create trigger before_insert_referral
  before insert on public.profiles
  for each row execute function public.apply_referral_self_bonus();

-- 3) After insert, award the referrer +25 as well
create or replace function public.apply_referrer_bonus()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.referred_by is not null and new.referral_bonus_granted_at is not null then
    update public.profiles
       set points = points + 25
     where id = new.referred_by;
  end if;
  return new;
end; $$;

drop trigger if exists after_insert_referrer_bonus on public.profiles;
create trigger after_insert_referrer_bonus
  after insert on public.profiles
  for each row execute function public.apply_referrer_bonus();
