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
  getSupabase: () => ({
    from: (t: string) => {
      (chain.from as ReturnType<typeof vi.fn>)(t);
      return chain;
    },
  }),
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
