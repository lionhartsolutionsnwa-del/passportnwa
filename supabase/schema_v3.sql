-- Passport NWA — schema v3 (run after schema_v2.sql)
-- Adds rating, hours, photos, activity tracking for richer restaurant pages.

alter table public.restaurants add column if not exists rating numeric(2,1);
alter table public.restaurants add column if not exists user_rating_count integer;
alter table public.restaurants add column if not exists price_level text;
alter table public.restaurants add column if not exists hours_text text[];
alter table public.restaurants add column if not exists photo_urls text[];
alter table public.restaurants add column if not exists last_activity_at timestamptz;

-- Update last_activity_at whenever a check-in lands
create or replace function public.bump_restaurant_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.restaurants set last_activity_at = now() where id = new.restaurant_id;
  return new;
end; $$;

drop trigger if exists on_checkin_bump_activity on public.checkins;
create trigger on_checkin_bump_activity
  after insert on public.checkins
  for each row execute function public.bump_restaurant_activity();
