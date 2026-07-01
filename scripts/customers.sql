-- Marketing/VIP customer list captured from the site (e.g. the VIP popup).
-- Applied to Supabase project mrqldsyixsxvwjowafny via migration
-- `create_customers_table`. Kept here for version control / reproducibility.
--
-- Writes go through the service-role key (/api/vip), which bypasses RLS.

create table if not exists public.customers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  phone         text,
  consent_email boolean not null default false,
  consent_sms   boolean not null default false,
  source        text not null default 'vip_popup',
  created_at    timestamptz not null default now()
);

comment on table public.customers is
  'Marketing/VIP customer list captured from the site (e.g. the VIP popup). Written by the service role via /api/vip.';

-- No public policies: anon/authenticated get no access; the service role
-- (server-only key) bypasses RLS for inserts/reads.
alter table public.customers enable row level security;
