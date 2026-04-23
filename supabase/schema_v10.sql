-- Passport NWA — schema v10 (run after schema_v9.sql)
-- Marketing consent + phone collection + unsubscribe tokens.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists email_marketing_consent boolean not null default false,
  add column if not exists sms_marketing_consent   boolean not null default false,
  add column if not exists consent_updated_at      timestamptz,
  add column if not exists unsubscribe_token       uuid not null default gen_random_uuid();

create unique index if not exists profiles_unsubscribe_token_idx on public.profiles(unsubscribe_token);

-- Update the signup trigger so phone + consent flags carry through from user_metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id, username, display_name, phone,
    email_marketing_consent, sms_marketing_consent, consent_updated_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    coalesce((new.raw_user_meta_data->>'email_marketing_consent')::boolean, false),
    coalesce((new.raw_user_meta_data->>'sms_marketing_consent')::boolean, false),
    now()
  )
  on conflict (id) do nothing;
  return new;
end; $$;
