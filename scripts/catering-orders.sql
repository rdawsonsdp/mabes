-- Mabe's catering orders table. Apply once against project mrqldsyixsxvwjowafny.
-- Writes happen only via the service-role client (server route handlers).
begin;

-- enums -------------------------------------------------------------------
do $$ begin
  create type catering_order_status as enum
    ('quote_requested', 'pending_payment', 'paid', 'confirmed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type catering_fulfillment_type as enum ('pickup', 'delivery');
exception when duplicate_object then null; end $$;

do $$ begin
  create type catering_payment_status as enum ('none', 'authorized', 'settled', 'failed');
exception when duplicate_object then null; end $$;

-- table -------------------------------------------------------------------
create table if not exists public.catering_orders (
  id                          uuid primary key default gen_random_uuid(),
  order_number                text not null unique,
  status                      catering_order_status not null default 'quote_requested',
  is_quote                    boolean not null default true,

  customer_name               text not null,
  customer_email              text not null,
  customer_phone              text,
  company                     text,

  event_date                  date,
  event_time                  text,
  headcount                   int,
  special_instructions        text,

  fulfillment_type            catering_fulfillment_type not null default 'pickup',
  delivery_address            text,

  subtotal_cents              int  not null default 0,
  delivery_fee_cents          int  not null default 0,
  tax_cents                   int  not null default 0,
  total_cents                 int  not null default 0,

  tax_exempt                  boolean not null default false,
  tax_exempt_certificate_url  text,

  payment_provider            text not null default 'braintree',
  payment_transaction_id      text,
  payment_status              catering_payment_status not null default 'none',

  items                       jsonb not null default '[]'::jsonb,
  admin_notes                 text,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- indexes -----------------------------------------------------------------
create index if not exists catering_orders_created_at_idx on public.catering_orders (created_at desc);
create index if not exists catering_orders_status_idx     on public.catering_orders (status);
create index if not exists catering_orders_event_date_idx on public.catering_orders (event_date);
create index if not exists catering_orders_email_idx      on public.catering_orders (customer_email);

-- updated_at trigger ------------------------------------------------------
-- Reuse the base schema's set_updated_at() if present; otherwise create it.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists catering_orders_set_updated_at on public.catering_orders;
create trigger catering_orders_set_updated_at
  before update on public.catering_orders
  for each row execute function public.set_updated_at();

-- RLS ---------------------------------------------------------------------
alter table public.catering_orders enable row level security;

drop policy if exists "admin read catering orders" on public.catering_orders;
create policy "admin read catering orders"
  on public.catering_orders for select
  to authenticated
  using (true);

drop policy if exists "admin update catering orders" on public.catering_orders;
create policy "admin update catering orders"
  on public.catering_orders for update
  to authenticated
  using (true)
  with check (true);
-- No INSERT policy for anon/authenticated → inserts require service_role.

commit;
