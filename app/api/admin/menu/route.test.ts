import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks (must be before imports of the module under test) ────────────────

// vi.hoisted ensures this is available in the vi.mock factory (which is hoisted)
const { mockGetAdminUser } = vi.hoisted(() => ({
  mockGetAdminUser: vi.fn(),
}));

vi.mock("@/app/lib/supabase/admin-auth", () => ({
  getAdminUser: mockGetAdminUser,
}));

// Flexible chain builder: each terminal call pops the next response.
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
      makeReq("PUT", {
        id: "p-new",
        name: "Renamed Wrap",
        basePriceCents: 1300,
        isAvailable: true,
        category: "Wraps",
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.product.name).toBe("Renamed Wrap");
  });

  it("returns 404 when the id does not match any product", async () => {
    responses = [{ data: null, error: null }]; // single: no row found

    const res = await PUT(
      makeReq("PUT", {
        id: "does-not-exist",
        name: "X",
        basePriceCents: 100,
        isAvailable: true,
        category: "Wraps",
      })
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
