-- Passport NWA — schema v13 (run after schema_v12.sql)
-- Track first-time onboarding so we only show the welcome animation once.

alter table public.profiles add column if not exists onboarded_at timestamptz;
