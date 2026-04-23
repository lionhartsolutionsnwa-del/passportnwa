-- Passport NWA — schema v8 (run after schema_v7.sql)
-- Full verification data on restaurant claims.

alter table public.restaurant_claims
  add column if not exists owner_full_name     text,
  add column if not exists business_legal_name text,
  add column if not exists ein                 text,
  add column if not exists verification_doc_path text;
