# Cart + Catalog (Clover-prep)

Server-side cart for Mabe's, backed by Supabase Postgres and built so the Clover
integration drops in later. Money is integer **cents** everywhere.

## Data flow

```
menu.json ──(scripts/build-seed.mjs)──> Supabase catalog
                                          (products, product_variants,
                                           modifier_groups, modifiers,
                                           product_modifier_groups)

Browser ──Server Actions (lib/cart/actions.ts)──> SupabaseCartStore (lib/cart/store.ts)
   │                                                   │
   └─ session id in httpOnly cookie (lib/cart/session.ts)
                                                       └─> carts / cart_items / cart_item_modifiers
checkout ──> orders / order_items / order_item_modifiers  (status 'pending')
```

- **Catalog** read side: `lib/catalog/catalog.ts` (`Catalog` interface + `SupabaseCatalog`).
- **Pricing/validation**: `lib/cart/pricing.ts` — `resolveSelection()` recomputes the
  unit price from catalog data on every add, so the client can never spoof a price.
- **Cart store**: `lib/cart/store.ts` (`CartStore` interface + `SupabaseCartStore`).
  Identical lines merge by signature (variant + modifier set + notes).
- **Storage client**: `lib/supabase/server.ts` — prefers `SUPABASE_SERVICE_ROLE_KEY`,
  falls back to the anon key.

Everything is interface-first (`Catalog`, `CartStore`) so the engine is swappable.

## Environment (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=...            # set
NEXT_PUBLIC_SUPABASE_ANON_KEY=...       # set (publishable)
SUPABASE_SERVICE_ROLE_KEY=             # paste before launch (see below)
```

Supabase project: **Mabes** (`mrqldsyixsxvwjowafny`).

## Re-seeding the catalog

Edit `app/menu.json`, then regenerate + apply:

```
node scripts/build-seed.mjs > scripts/seed.sql   # idempotent upserts
# apply scripts/seed.sql to the DB (Supabase SQL editor / MCP / psql)
```

The mapping rules (which sections get the combo / add-on / size groups, price
backfill for smoothies $8 and kids $6) live in `scripts/build-seed.mjs`.

## Before launch / before collecting customer PII

1. **Service-role key** — paste the `service_role` secret from Supabase →
   Project Settings → API into `SUPABASE_SERVICE_ROLE_KEY`. The store then uses
   it for all writes (bypasses RLS).
2. **Tighten RLS** — drop the temporary permissive anon policies on
   `carts/cart_items/cart_item_modifiers/orders/order_items/order_item_modifiers`
   (migration `cart_anon_rls_pre_clover`). With the service-role key in place the
   server no longer needs anon write access.

## Clover integration (later)

The schema already carries `clover_item_id`, `clover_variant_id`,
`clover_group_id`, `clover_modifier_id`, and `orders.clover_order_id`. To wire it:

1. Sync the catalog from Clover (or push our catalog to Clover) and fill the
   `clover_*_id` columns.
2. In `SupabaseCartStore.checkout()` (after the order rows are written), create
   the Clover order from the snapshotted `order_items` + `order_item_modifiers`,
   then store the returned id in `orders.clover_order_id` and flip
   `orders.status` to `'submitted'`.
3. Replace the "Coming Soon" confirmation in `components/cart/CartDrawer.tsx`
   with the real order/payment result.
