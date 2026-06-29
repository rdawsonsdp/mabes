import { describe, it, expect, beforeEach, vi } from "vitest";

// Mutable holder the hoisted mock reads from. Each getSupabase() call builds a
// fresh chainable builder; we capture the last one to assert on its calls.
const h = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  builder: null as null | {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    neq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
    in: ReturnType<typeof vi.fn>;
  },
}));

vi.mock("@/app/lib/supabase/server", () => ({
  usingServiceRole: true,
  getSupabase: () => {
    const builder: Record<string, unknown> = {};
    builder.select = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.neq = vi.fn(() => builder);
    builder.in = vi.fn(() => builder);
    builder.order = vi.fn(() => Promise.resolve({ data: h.rows, error: null }));
    builder.maybeSingle = vi.fn(() => Promise.resolve({ data: h.rows[0] ?? null, error: null }));
    h.builder = builder as typeof h.builder;
    return { from: vi.fn(() => builder) };
  },
}));

// Import after the mock is registered.
import { catalog, groupByMenu } from "./catalog";

function cateringRow(over: Partial<Record<string, unknown>>): Record<string, unknown> {
  return {
    id: "p1",
    slug: "catering-the-blue-fish-box",
    name: "The Blue Fish Sandwich Box",
    description: "Tuna Salad w/ Pepper Jack on Texas Toast. Served with chips.",
    base_price_cents: 1200,
    menu: "catering",
    category: "Boxed Lunches",
    image: null,
    is_available: true,
    sort_order: 0,
    product_variants: [],
    product_modifier_groups: [],
    ...over,
  };
}

describe("catalog.getCateringProducts", () => {
  beforeEach(() => {
    h.rows = [];
    h.builder = null;
  });

  it("filters to menu='catering' and is_available, ordered by sort_order", async () => {
    h.rows = [cateringRow({})];
    await catalog.getCateringProducts();

    expect(h.builder).not.toBeNull();
    expect(h.builder!.eq).toHaveBeenCalledWith("menu", "catering");
    expect(h.builder!.eq).toHaveBeenCalledWith("is_available", true);
    expect(h.builder!.order).toHaveBeenCalledWith("sort_order", { ascending: true });
  });

  it("maps rows into Product objects (cents preserved)", async () => {
    h.rows = [
      cateringRow({}),
      cateringRow({
        id: "p2",
        slug: "catering-wrap-tray",
        name: "Mabe's Wrap Tray",
        base_price_cents: 12500,
        category: "Trays",
        sort_order: 16,
      }),
    ];
    const products = await catalog.getCateringProducts();

    expect(products).toHaveLength(2);
    expect(products[0]).toMatchObject({
      id: "p1",
      slug: "catering-the-blue-fish-box",
      name: "The Blue Fish Sandwich Box",
      basePriceCents: 1200,
      menu: "catering",
      category: "Boxed Lunches",
    });
    expect(products[1].basePriceCents).toBe(12500);
  });

  it("maps nested modifier groups (cheese single-select) onto the product", async () => {
    h.rows = [
      cateringRow({
        product_modifier_groups: [
          {
            sort_order: 0,
            modifier_groups: {
              id: "g-cheese",
              name: "Choice of cheese",
              selection_type: "single",
              min_select: 1,
              max_select: 1,
              sort_order: 100,
              modifiers: [
                { id: "m1", name: "Swiss", price_cents: 0, is_default: true, sort_order: 0 },
                { id: "m2", name: "Pepper Jack", price_cents: 0, is_default: false, sort_order: 1 },
              ],
            },
          },
        ],
      }),
    ];
    const [product] = await catalog.getCateringProducts();

    expect(product.modifierGroups).toHaveLength(1);
    expect(product.modifierGroups[0]).toMatchObject({
      id: "g-cheese",
      name: "Choice of cheese",
      selectionType: "single",
      minSelect: 1,
      maxSelect: 1,
    });
    expect(product.modifierGroups[0].modifiers.map((m) => m.name)).toEqual([
      "Swiss",
      "Pepper Jack",
    ]);
  });

  it("groups catering products into one menu with categories in sort order", async () => {
    h.rows = [
      cateringRow({ id: "p1", category: "Boxed Lunches", sort_order: 0 }),
      cateringRow({ id: "p2", category: "Trays", sort_order: 16 }),
      cateringRow({ id: "p3", category: "Add-Ons", sort_order: 20 }),
    ];
    const grouped = groupByMenu(await catalog.getCateringProducts());

    expect(grouped).toHaveLength(1);
    expect(grouped[0].menu).toBe("catering");
    expect(grouped[0].categories.map((c) => c.category)).toEqual([
      "Boxed Lunches",
      "Trays",
      "Add-Ons",
    ]);
  });
});

describe("catalog.getProducts", () => {
  beforeEach(() => {
    h.rows = [];
    h.builder = null;
  });

  it("excludes catering items via .neq('menu', 'catering')", async () => {
    h.rows = [];
    await catalog.getProducts();

    expect(h.builder).not.toBeNull();
    expect(h.builder!.neq).toHaveBeenCalledWith("menu", "catering");
  });
});
