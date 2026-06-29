# Catering Menu Admin API + Nav Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the data layer, CRUD API route, and shared admin navigation bar for the catering menu editor — no UI editor yet, just the foundation the editor page will sit on.

**Architecture:** Three independent layers: (1) a Supabase admin query (`getAllCateringMenuItems`) added to the existing `admin-queries.ts`; (2) a new `app/api/admin/menu/route.ts` Route Handler that gates all methods with `getAdminUser()`; (3) a `"use client"` `AdminNav` component that replaces `AdminBar` in the two existing admin pages. All money stays as integer cents throughout.

**Tech Stack:** Next.js 16 / React 19, Supabase JS v2 (service-role via `getSupabase()`), Vitest 3 + jsdom, `@testing-library/react` v16, TypeScript 5.

## Global Constraints

- Branch: `catering-store`; working dir `/Users/robd/u01/CGIRestaurants/Mabe75/mabes`
- Next.js 16 / React 19 — no `"use server"` directives in Route Handlers; use `export async function POST(request: NextRequest)`
- Money is always integer cents; the route stores `base_price_cents` as-is
- Auth gate on every Route Handler method: `if (!(await getAdminUser())) return NextResponse.json({error:"Unauthorized"},{status:401})`
- `getSupabase()` (service-role) for all DB operations, never the browser/anon client
- Catering categories are exactly: `"Boxed Lunches" | "Wraps" | "Trays" | "Add-Ons"`
- Test runner: `npx vitest run` (alias `npm test`); all tests must PASS before any commit
- Do NOT run `npm run build`; a dev server is already running on `:3000`
- Commits must end with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- Slug format: `"catering-" + kebab-case(name)`, e.g. `"catering-wrap-tray"`

---

## File Map

| Action   | Path                                                          | Responsibility                                               |
|----------|---------------------------------------------------------------|--------------------------------------------------------------|
| Modify   | `app/lib/catalog/catalog.ts`                                  | Export `SELECT`, `Row`, `mapProduct` for reuse               |
| Modify   | `app/lib/catering/admin-queries.ts`                           | Add `getAllCateringMenuItems()` using imported mapper         |
| Create   | `app/lib/catering/admin-menu-queries.test.ts`                 | Unit test: no is_available filter, maps Products             |
| Create   | `app/api/admin/menu/route.ts`                                 | POST/PUT/DELETE with auth gate                               |
| Create   | `app/api/admin/menu/route.test.ts`                            | 401 × 3 methods; POST validates + creates; PUT updates; DEL  |
| Create   | `app/components/admin/AdminNav.tsx`                           | "use client" top nav; Menu + Orders links; sign-out          |
| Create   | `app/components/admin/AdminNav.test.tsx`                      | Renders two nav links; active state                          |
| Modify   | `app/admin/catering/page.tsx`                                 | Replace `<AdminBar>` with `<AdminNav />`                     |
| Modify   | `app/admin/catering/[id]/page.tsx`                            | Replace `<AdminBar>` with `<AdminNav />`                     |

---

## Task 1: Export shared mappers from catalog.ts

**Files:**
- Modify: `app/lib/catalog/catalog.ts`

**Interfaces:**
- Produces: `export const SELECT`, `export type Row`, `export function mapProduct(r: Row): Product`
  (these are consumed by Task 2; the existing `catalog` class usage is unchanged)

- [ ] **Step 1.1: Read current catalog.ts**

  Already done in planning. Confirm the `SELECT`, `Row`, and `mapProduct` are currently unexported (they are).

- [ ] **Step 1.2: Export SELECT, Row, and mapProduct**

  In `app/lib/catalog/catalog.ts`, change three lines:

  ```diff
  - const SELECT = `
  + export const SELECT = `
  ```

  ```diff
  - type Row = Record<string, unknown>;
  + export type Row = Record<string, unknown>;
  ```

  ```diff
  - function mapProduct(r: Row): Product {
  + export function mapProduct(r: Row): Product {
  ```

  The inner helpers `mapVariant`, `mapModifier`, `mapGroup`, `num`, `bySort` remain unexported.
  The existing `SupabaseCatalog` class already uses `SELECT` and `mapProduct` — no change needed there.

- [ ] **Step 1.3: Verify existing catalog tests still pass**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes && npx vitest run app/lib/catalog/catalog.test.ts
  ```

  Expected: all tests PASS (export additions don't change behavior).

- [ ] **Step 1.4: Commit**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes
  git add app/lib/catalog/catalog.ts
  git commit -m "$(cat <<'EOF'
  feat: export SELECT + mapProduct from catalog.ts for admin reuse

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 2: Add getAllCateringMenuItems to admin-queries.ts (TDD)

**Files:**
- Modify: `app/lib/catering/admin-queries.ts`
- Create: `app/lib/catering/admin-menu-queries.test.ts`

**Interfaces:**
- Consumes: `SELECT`, `Row`, `mapProduct` from `app/lib/catalog/catalog.ts`; `getSupabase` from `app/lib/supabase/server`; `Product` from `app/lib/types`
- Produces: `export async function getAllCateringMenuItems(): Promise<Product[]>`

- [ ] **Step 2.1: Write the failing test**

  Create `app/lib/catering/admin-menu-queries.test.ts`:

  ```typescript
  import { describe, it, expect, vi, beforeEach } from "vitest";

  // --- Flexible chain builder -------------------------------------------------
  // Each terminal call (.maybeSingle / .single / await) pops the next response
  // from `responses`. Reset `responses` and `chain` in each test.
  let responses: Array<{ data: unknown; error: null | { message: string } }> = [];

  function makeChain() {
    let idx = 0;
    const next = () =>
      Promise.resolve(responses[idx++] ?? { data: null, error: null });
    const c: Record<string, unknown> = {};
    c.from = vi.fn(() => c);
    c.select = vi.fn(() => c);
    c.eq = vi.fn(() => c);
    c.order = vi.fn(() => c);
    c.single = vi.fn(() => next());
    c.maybeSingle = vi.fn(() => next());
    // Make the chain itself awaitable (for queries ending without .single())
    c.then = function (
      resolve: (v: unknown) => unknown,
      reject?: (e: unknown) => unknown
    ) {
      return next().then(resolve, reject);
    };
    return c;
  }

  let chain = makeChain();

  vi.mock("@/app/lib/supabase/server", () => ({
    getSupabase: () => ({ from: (t: string) => { (chain.from as ReturnType<typeof vi.fn>)(t); return chain; } }),
    usingServiceRole: true,
  }));

  import { getAllCateringMenuItems } from "./admin-queries";

  const SAMPLE_ROW = {
    id: "p1",
    slug: "catering-wrap-tray",
    name: "Mabe's Wrap Tray",
    description: "Assorted wraps cut in thirds",
    base_price_cents: 12500,
    menu: "catering",
    category: "Trays",
    image: null,
    is_available: false, // note: unavailable — admin query should include this
    sort_order: 4,
    product_variants: [],
    product_modifier_groups: [],
  };

  describe("getAllCateringMenuItems", () => {
    beforeEach(() => {
      responses = [];
      chain = makeChain();
    });

    it("queries menu='catering' without any is_available filter", async () => {
      responses = [{ data: [SAMPLE_ROW], error: null }];
      await getAllCateringMenuItems();

      expect(chain.from).toHaveBeenCalledWith("products");
      // eq should have been called ONLY for menu='catering'
      const eqCalls = (chain.eq as ReturnType<typeof vi.fn>).mock.calls;
      const isAvailableCall = eqCalls.find(([k]: [string]) => k === "is_available");
      expect(isAvailableCall).toBeUndefined();
      const menuCall = eqCalls.find(([k]: [string]) => k === "menu");
      expect(menuCall).toEqual(["menu", "catering"]);
    });

    it("orders by category then sort_order", async () => {
      responses = [{ data: [SAMPLE_ROW], error: null }];
      await getAllCateringMenuItems();

      const orderCalls = (chain.order as ReturnType<typeof vi.fn>).mock.calls;
      expect(orderCalls[0]).toEqual(["category"]);
      expect(orderCalls[1]).toEqual(["sort_order"]);
    });

    it("maps DB rows to Product objects and includes unavailable items", async () => {
      responses = [{ data: [SAMPLE_ROW], error: null }];
      const products = await getAllCateringMenuItems();

      expect(products).toHaveLength(1);
      expect(products[0]).toMatchObject({
        id: "p1",
        slug: "catering-wrap-tray",
        name: "Mabe's Wrap Tray",
        basePriceCents: 12500,
        menu: "catering",
        category: "Trays",
        isAvailable: false,
      });
    });

    it("throws on Supabase error", async () => {
      responses = [{ data: null, error: { message: "db failure" } }];
      await expect(getAllCateringMenuItems()).rejects.toThrow(
        "Catering menu load failed: db failure"
      );
    });
  });
  ```

- [ ] **Step 2.2: Run test to confirm it fails**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes && npx vitest run app/lib/catering/admin-menu-queries.test.ts
  ```

  Expected: FAIL — `getAllCateringMenuItems is not a function` (or similar import error).

- [ ] **Step 2.3: Implement getAllCateringMenuItems**

  In `app/lib/catering/admin-queries.ts`, add at the top:

  ```typescript
  import { SELECT, mapProduct, type Row } from "@/app/lib/catalog/catalog";
  import type { Product } from "@/app/lib/types";
  ```

  Add at the bottom of the file (after `listCateringOrders`):

  ```typescript
  /**
   * All catering products regardless of availability — for admin use only.
   * Uses the same SELECT + mapProduct as the public catalog, but omits the
   * is_available=true filter so admins can edit hidden/draft items.
   */
  export async function getAllCateringMenuItems(): Promise<Product[]> {
    const { data, error } = await getSupabase()
      .from("products")
      .select(SELECT)
      .eq("menu", "catering")
      .order("category")
      .order("sort_order");
    if (error) throw new Error(`Catering menu load failed: ${error.message}`);
    return (data ?? []).map((r) => mapProduct(r as Row));
  }
  ```

- [ ] **Step 2.4: Run test to confirm it passes**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes && npx vitest run app/lib/catering/admin-menu-queries.test.ts
  ```

  Expected: 4/4 PASS.

- [ ] **Step 2.5: Run all existing admin tests to confirm no regression**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes && npx vitest run app/lib/catering/admin-queries.test.ts app/lib/catalog/catalog.test.ts
  ```

  Expected: all PASS.

- [ ] **Step 2.6: Commit**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes
  git add app/lib/catering/admin-queries.ts app/lib/catering/admin-menu-queries.test.ts
  git commit -m "$(cat <<'EOF'
  feat: add getAllCateringMenuItems admin query (no is_available filter)

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 3: CRUD API Route (TDD)

**Files:**
- Create: `app/api/admin/menu/route.ts`
- Create: `app/api/admin/menu/route.test.ts`

**Interfaces:**
- Consumes: `getAdminUser` from `app/lib/supabase/admin-auth`; `getSupabase` from `app/lib/supabase/server`
- Produces:
  - `POST /api/admin/menu` → 201 `{product}` or 400 `{error}`
  - `PUT /api/admin/menu` → 200 `{product}` or 404 `{error}` or 400 `{error}`
  - `DELETE /api/admin/menu?id=<uuid>` → 200 `{ok:true}` or 400 `{error}`
  - All return 401 `{error:"Unauthorized"}` when unauthed

- [ ] **Step 3.1: Write the failing tests**

  Create `app/api/admin/menu/route.test.ts`:

  ```typescript
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import { NextRequest } from "next/server";

  // ── Mocks (must be before imports of the module under test) ────────────────

  const mockGetAdminUser = vi.fn();
  vi.mock("@/app/lib/supabase/admin-auth", () => ({
    getAdminUser: mockGetAdminUser,
  }));

  // Flexible chain builder identical to Task 2's test
  let responses: Array<{ data: unknown; error: null | { message: string } }> = [];

  function makeChain() {
    let idx = 0;
    const next = () =>
      Promise.resolve(responses[idx++] ?? { data: null, error: null });
    const c: Record<string, unknown> = {};
    c.from = vi.fn(() => c);
    c.select = vi.fn(() => c);
    c.eq = vi.fn(() => c);
    c.insert = vi.fn(() => c);
    c.update = vi.fn(() => c);
    c.delete = vi.fn(() => c);
    c.order = vi.fn(() => c);
    c.neq = vi.fn(() => c);
    c.single = vi.fn(() => next());
    c.maybeSingle = vi.fn(() => next());
    c.then = function (
      resolve: (v: unknown) => unknown,
      reject?: (e: unknown) => unknown
    ) {
      return next().then(resolve, reject);
    };
    return c;
  }

  let chain = makeChain();

  vi.mock("@/app/lib/supabase/server", () => ({
    getSupabase: () => ({
      from: (t: string) => {
        (chain.from as ReturnType<typeof vi.fn>)(t);
        return chain;
      },
    }),
  }));

  // Import after mocks
  import { POST, PUT, DELETE } from "./route";

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const ADMIN_USER = { id: "admin-uid" };

  const CREATED_PRODUCT = {
    id: "p-new",
    slug: "catering-test-wrap",
    name: "Test Wrap",
    description: null,
    base_price_cents: 1200,
    menu: "catering",
    category: "Wraps",
    image: null,
    is_available: true,
    sort_order: 0,
  };

  function makeReq(
    method: string,
    body?: unknown,
    searchParams?: string
  ): NextRequest {
    const url = `http://localhost/api/admin/menu${searchParams ? "?" + searchParams : ""}`;
    return new NextRequest(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // ── Test suites ─────────────────────────────────────────────────────────────

  beforeEach(() => {
    mockGetAdminUser.mockReset();
    responses = [];
    chain = makeChain();
  });

  describe("401 when unauthenticated", () => {
    beforeEach(() => mockGetAdminUser.mockResolvedValue(null));

    it("POST returns 401", async () => {
      const res = await POST(makeReq("POST", { name: "X" }));
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ error: "Unauthorized" });
    });

    it("PUT returns 401", async () => {
      const res = await PUT(makeReq("PUT", { id: "p1" }));
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ error: "Unauthorized" });
    });

    it("DELETE returns 401", async () => {
      const res = await DELETE(makeReq("DELETE", undefined, "id=p1"));
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ error: "Unauthorized" });
    });
  });

  describe("POST /api/admin/menu", () => {
    beforeEach(() => mockGetAdminUser.mockResolvedValue(ADMIN_USER));

    it("creates a product with menu='catering' and a catering- slug", async () => {
      // First DB call: slug uniqueness check → no conflict
      // Second DB call: insert → created product
      responses = [
        { data: null, error: null }, // maybeSingle: slug not taken
        { data: CREATED_PRODUCT, error: null }, // single: inserted row
      ];

      const res = await POST(
        makeReq("POST", {
          name: "Test Wrap",
          description: null,
          basePriceCents: 1200,
          category: "Wraps",
          image: null,
          isAvailable: true,
          sortOrder: 0,
        })
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.product.menu).toBe("catering");
      expect(body.product.slug).toMatch(/^catering-/);
    });

    it("returns 400 when name is empty", async () => {
      const res = await POST(
        makeReq("POST", {
          name: "",
          basePriceCents: 1200,
          category: "Wraps",
          isAvailable: true,
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when basePriceCents is negative", async () => {
      const res = await POST(
        makeReq("POST", {
          name: "Bad Item",
          basePriceCents: -1,
          category: "Wraps",
          isAvailable: true,
        })
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when category is not in the catering list", async () => {
      const res = await POST(
        makeReq("POST", {
          name: "Pizza Slice",
          basePriceCents: 500,
          category: "Pizza",
          isAvailable: true,
        })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/category/i);
    });
  });

  describe("PUT /api/admin/menu", () => {
    beforeEach(() => mockGetAdminUser.mockResolvedValue(ADMIN_USER));

    it("updates the product and returns the updated row", async () => {
      const updated = { ...CREATED_PRODUCT, name: "Renamed Wrap" };
      responses = [{ data: updated, error: null }]; // single: updated row

      const res = await PUT(
        makeReq("PUT", { id: "p-new", name: "Renamed Wrap", basePriceCents: 1300, isAvailable: true, category: "Wraps" })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.product.name).toBe("Renamed Wrap");
    });

    it("returns 404 when the id does not match any product", async () => {
      responses = [{ data: null, error: null }]; // single: no row found

      const res = await PUT(
        makeReq("PUT", { id: "does-not-exist", name: "X", basePriceCents: 100, isAvailable: true, category: "Wraps" })
      );
      expect(res.status).toBe(404);
    });

    it("returns 400 when id is missing from body", async () => {
      const res = await PUT(makeReq("PUT", { name: "X" }));
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/admin/menu", () => {
    beforeEach(() => mockGetAdminUser.mockResolvedValue(ADMIN_USER));

    it("deletes modifier group links then the product, returns {ok:true}", async () => {
      // Two delete operations, both return { error: null }
      responses = [
        { data: null, error: null }, // delete product_modifier_groups links
        { data: null, error: null }, // delete product row
      ];

      const res = await DELETE(makeReq("DELETE", undefined, "id=p-new"));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);

      // Verify product_modifier_groups was hit first
      const fromCalls = (chain.from as ReturnType<typeof vi.fn>).mock.calls;
      expect(fromCalls[0][0]).toBe("product_modifier_groups");
      expect(fromCalls[1][0]).toBe("products");
    });

    it("returns 400 when no id is provided", async () => {
      const res = await DELETE(makeReq("DELETE"));
      expect(res.status).toBe(400);
    });
  });
  ```

- [ ] **Step 3.2: Run tests to confirm they fail**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes && npx vitest run app/api/admin/menu/route.test.ts
  ```

  Expected: FAIL — `Cannot find module './route'`.

- [ ] **Step 3.3: Implement the API route**

  Create `app/api/admin/menu/route.ts`:

  ```typescript
  import { NextResponse, type NextRequest } from "next/server";
  import { getAdminUser } from "@/app/lib/supabase/admin-auth";
  import { getSupabase } from "@/app/lib/supabase/server";

  const CATERING_CATEGORIES = ["Boxed Lunches", "Wraps", "Trays", "Add-Ons"] as const;
  type CateringCategory = (typeof CATERING_CATEGORIES)[number];

  function toSlug(name: string): string {
    return (
      "catering-" +
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  /** Deduplicate `slug` by appending -2, -3, etc. if already taken. */
  async function uniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let attempt = 1;
    for (;;) {
      const { data } = await getSupabase()
        .from("products")
        .select("slug")
        .eq("slug", candidate)
        .maybeSingle();
      if (!data) return candidate;
      attempt += 1;
      candidate = `${base}-${attempt}`;
    }
  }

  // ── POST — create ──────────────────────────────────────────────────────────

  export async function POST(request: NextRequest) {
    if (!(await getAdminUser())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      basePriceCents?: number;
      category?: string;
      image?: string | null;
      isAvailable?: boolean;
      sortOrder?: number;
    };

    // Validation
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (
      typeof body.basePriceCents !== "number" ||
      !Number.isInteger(body.basePriceCents) ||
      body.basePriceCents < 0
    ) {
      return NextResponse.json(
        { error: "basePriceCents must be a non-negative integer" },
        { status: 400 }
      );
    }
    if (!CATERING_CATEGORIES.includes(body.category as CateringCategory)) {
      return NextResponse.json(
        {
          error: `category must be one of: ${CATERING_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const slug = await uniqueSlug(toSlug(body.name.trim()));

    const { data, error } = await getSupabase()
      .from("products")
      .insert({
        name: body.name.trim(),
        description: body.description ?? null,
        base_price_cents: body.basePriceCents,
        menu: "catering",
        category: body.category,
        image: body.image ?? null,
        is_available: body.isAvailable ?? true,
        sort_order: body.sortOrder ?? 0,
        slug,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ product: data }, { status: 201 });
  }

  // ── PUT — update ───────────────────────────────────────────────────────────

  export async function PUT(request: NextRequest) {
    if (!(await getAdminUser())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      id?: string;
      name?: string;
      description?: string | null;
      basePriceCents?: number;
      category?: string;
      image?: string | null;
      isAvailable?: boolean;
      sortOrder?: number;
    };

    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (
      body.category !== undefined &&
      !CATERING_CATEGORIES.includes(body.category as CateringCategory)
    ) {
      return NextResponse.json(
        {
          error: `category must be one of: ${CATERING_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.basePriceCents !== undefined)
      updates.base_price_cents = body.basePriceCents;
    if (body.category !== undefined) updates.category = body.category;
    if (body.image !== undefined) updates.image = body.image;
    if (body.isAvailable !== undefined) updates.is_available = body.isAvailable;
    if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await getSupabase()
      .from("products")
      .update(updates)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ product: data });
  }

  // ── DELETE — remove ────────────────────────────────────────────────────────

  export async function DELETE(request: NextRequest) {
    if (!(await getAdminUser())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    // Also accept id in request body as a fallback
    if (!id) {
      try {
        const body = (await request.json()) as { id?: string };
        id = body.id ?? null;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Best-effort: delete modifier group links first (FK may not cascade)
    await getSupabase()
      .from("product_modifier_groups")
      .delete()
      .eq("product_id", id);

    // Delete the product row
    const { error } = await getSupabase()
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }
  ```

- [ ] **Step 3.4: Run tests to confirm they pass**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes && npx vitest run app/api/admin/menu/route.test.ts
  ```

  Expected: all tests PASS (3 × 401 + POST × 3 + PUT × 3 + DELETE × 2 = 11 tests).

- [ ] **Step 3.5: Commit**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes
  git add app/api/admin/menu/route.ts app/api/admin/menu/route.test.ts
  git commit -m "$(cat <<'EOF'
  feat: add POST/PUT/DELETE API route for catering menu admin

  All methods gate with getAdminUser() and return 401 when unauthed.
  POST validates name, basePriceCents, category and generates a
  catering-<slug> with deduplication. DELETE removes modifier group
  links before the product row.

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 4: AdminNav component + wire into admin pages (TDD)

**Files:**
- Create: `app/components/admin/AdminNav.tsx`
- Create: `app/components/admin/AdminNav.test.tsx`
- Modify: `app/admin/catering/page.tsx`
- Modify: `app/admin/catering/[id]/page.tsx`

**Interfaces:**
- Consumes: `usePathname` from `next/navigation`; `useRouter` from `next/navigation`; `createBrowserSupabase` from `app/lib/supabase/browser`
- Produces: `export function AdminNav()` — renders brand link, Menu link (`/admin/menu`), Orders link (`/admin/catering`), sign-out button

- [ ] **Step 4.1: Write the failing test**

  Create `app/components/admin/AdminNav.test.tsx`:

  ```tsx
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import { render, screen } from "@testing-library/react";

  const mockPathname = vi.fn(() => "/admin/menu");
  const mockRouterReplace = vi.fn();
  const mockRouterRefresh = vi.fn();
  const mockSignOut = vi.fn(() => Promise.resolve({ error: null }));

  vi.mock("next/navigation", () => ({
    usePathname: () => mockPathname(),
    useRouter: () => ({ replace: mockRouterReplace, refresh: mockRouterRefresh }),
  }));

  vi.mock("@/app/lib/supabase/browser", () => ({
    createBrowserSupabase: () => ({ auth: { signOut: mockSignOut } }),
  }));

  import { AdminNav } from "./AdminNav";

  describe("AdminNav", () => {
    beforeEach(() => {
      mockPathname.mockReturnValue("/admin/menu");
      mockRouterReplace.mockReset();
      mockSignOut.mockReset();
      mockSignOut.mockResolvedValue({ error: null });
    });

    it("renders a link to /admin/menu labelled Menu", () => {
      render(<AdminNav />);
      const link = screen.getByRole("link", { name: /menu/i });
      expect(link).toHaveAttribute("href", "/admin/menu");
    });

    it("renders a link to /admin/catering labelled Orders", () => {
      render(<AdminNav />);
      const link = screen.getByRole("link", { name: /orders/i });
      expect(link).toHaveAttribute("href", "/admin/catering");
    });

    it("renders the brand text 'Mabe\\'s Admin'", () => {
      render(<AdminNav />);
      // The brand may be a link or a span; just check it's present
      expect(screen.getByText(/Mabe.*Admin/i)).toBeInTheDocument();
    });

    it("applies an active class to the Menu link when pathname is /admin/menu", () => {
      mockPathname.mockReturnValue("/admin/menu");
      render(<AdminNav />);
      const link = screen.getByRole("link", { name: /menu/i });
      // Active link has bg-cream class (applied by the component)
      expect(link).toHaveClass("bg-cream");
    });

    it("applies an active class to the Orders link when pathname starts with /admin/catering", () => {
      mockPathname.mockReturnValue("/admin/catering");
      render(<AdminNav />);
      const link = screen.getByRole("link", { name: /orders/i });
      expect(link).toHaveClass("bg-cream");
    });

    it("renders a Sign out button", () => {
      render(<AdminNav />);
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });
  });
  ```

- [ ] **Step 4.2: Run test to confirm it fails**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes && npx vitest run app/components/admin/AdminNav.test.tsx
  ```

  Expected: FAIL — `Cannot find module './AdminNav'`.

- [ ] **Step 4.3: Implement AdminNav**

  Create `app/components/admin/AdminNav.tsx`:

  ```tsx
  "use client";

  import Link from "next/link";
  import { usePathname, useRouter } from "next/navigation";
  import { createBrowserSupabase } from "@/app/lib/supabase/browser";

  const LINKS: { href: string; label: string }[] = [
    { href: "/admin/menu", label: "Menu" },
    { href: "/admin/catering", label: "Orders" },
  ];

  export function AdminNav() {
    const pathname = usePathname();
    const router = useRouter();

    const signOut = async () => {
      await createBrowserSupabase().auth.signOut();
      router.replace("/admin/login");
      router.refresh();
    };

    return (
      <header className="flex items-center justify-between bg-maroon px-6 py-3 text-cream">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/admin/catering"
            className="font-display text-h4 hover:text-copper"
          >
            Mabe&apos;s Admin
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`font-display rounded-pill px-4 py-1.5 text-small tracking-wide transition-colors ${
                    active
                      ? "bg-cream text-maroon"
                      : "text-cream/80 hover:bg-cream/20"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="font-display rounded-pill border border-cream/40 px-4 py-1.5 text-small tracking-wide transition-colors hover:bg-cream hover:text-maroon"
        >
          Sign out
        </button>
      </header>
    );
  }
  ```

- [ ] **Step 4.4: Run component test to confirm it passes**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes && npx vitest run app/components/admin/AdminNav.test.tsx
  ```

  Expected: 6/6 PASS.

- [ ] **Step 4.5: Wire AdminNav into the catering orders list page**

  In `app/admin/catering/page.tsx`:

  1. Replace the import:
     ```diff
     - import { AdminBar } from "@/app/components/admin/AdminBar";
     + import { AdminNav } from "@/app/components/admin/AdminNav";
     ```

  2. Replace the JSX usage:
     ```diff
     - <AdminBar title="Catering Orders" />
     + <AdminNav />
     ```

- [ ] **Step 4.6: Wire AdminNav into the catering order detail page**

  In `app/admin/catering/[id]/page.tsx`:

  1. Replace the import:
     ```diff
     - import { AdminBar } from "@/app/components/admin/AdminBar";
     + import { AdminNav } from "@/app/components/admin/AdminNav";
     ```

  2. Replace the JSX usage:
     ```diff
     - <AdminBar title={`Order ${order.orderNumber}`} />
     + <AdminNav />
     ```

  Note: The order number is still displayed in the `<h1>` within the page body — no information is lost.

- [ ] **Step 4.7: Run tsc to confirm no type errors**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes && npx tsc --noEmit
  ```

  Expected: zero errors.

- [ ] **Step 4.8: Run the full test suite**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes && npm test
  ```

  Expected: all tests PASS (new + existing).

- [ ] **Step 4.9: Commit**

  ```bash
  cd /Users/robd/u01/CGIRestaurants/Mabe75/mabes
  git add app/components/admin/AdminNav.tsx app/components/admin/AdminNav.test.tsx \
          app/admin/catering/page.tsx app/admin/catering/[id]/page.tsx
  git commit -m "$(cat <<'EOF'
  feat: add AdminNav with Menu/Orders links; replace AdminBar in admin pages

  AdminNav is a "use client" top bar with active-state links to /admin/menu
  and /admin/catering, plus a sign-out button — avoids duplicating the
  sign-out that was in AdminBar. AdminBar itself is unchanged.

  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

---

## Task 5: Write report file

- [ ] **Step 5.1: Write the report**

  Create `.superpowers/sdd/admin-menu-api-report.md` with:
  - Status
  - Commit SHAs + subjects
  - Test counts (new + existing)
  - tsc result
  - Confirmation that all three HTTP methods return 401 when `getAdminUser()` returns null
  - Any concerns

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - `getAllCateringMenuItems` → Task 2 ✓
  - API route POST/PUT/DELETE with auth gate → Task 3 ✓
  - POST validates name/basePriceCents/category → Task 3 ✓
  - Slug = `catering-` + kebab-case with deduplication → Task 3 ✓
  - DELETE removes `product_modifier_groups` links first → Task 3 ✓
  - `AdminNav` with Menu + Orders + active state + sign-out → Task 4 ✓
  - AdminNav in both admin pages, no duplicate sign-out → Task 4 ✓
  - `tsc --noEmit` clean → Task 4.7 ✓
  - Report file at `.superpowers/sdd/admin-menu-api-report.md` → Task 5 ✓

- [x] **No placeholders** — all code blocks are complete and runnable.

- [x] **Type consistency:**
  - `mapProduct` exported from `catalog.ts` in Task 1; imported in Task 2 as `mapProduct`
  - `getAdminUser` imported the same way in Task 3 as in existing route handlers
  - `createBrowserSupabase` imported the same way as in existing `AdminBar`
  - `AdminNav` exported as named export; imported in admin pages as `{ AdminNav }`
