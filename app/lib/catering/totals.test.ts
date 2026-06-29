import { describe, it, expect } from "vitest";
import type { Product, ModifierGroup } from "@/app/lib/types";
import type { CateringCartItem } from "./types";
import { repriceItems, computeCateringTotals } from "./totals";

function product(over: Partial<Product> = {}): Product {
  return {
    id: "p1",
    slug: "catering-the-blue-fish-box",
    name: "The Blue Fish Sandwich Box",
    description: null,
    basePriceCents: 1200,
    menu: "catering",
    category: "Boxed Lunches",
    image: null,
    isAvailable: true,
    sortOrder: 0,
    variants: [],
    modifierGroups: [
      {
        id: "g1",
        name: "Choice of cheese",
        selectionType: "single",
        minSelect: 1,
        maxSelect: 1,
        sortOrder: 0,
        modifiers: [
          { id: "m-swiss", name: "Swiss", priceCents: 0, isDefault: true, sortOrder: 0 },
          { id: "m-extra", name: "Extra cheese", priceCents: 75, isDefault: false, sortOrder: 1 },
        ],
      },
    ],
    ...over,
  };
}

function cartItem(over: Partial<CateringCartItem> = {}): CateringCartItem {
  return {
    lineId: "l1",
    productId: "p1",
    productSlug: "catering-the-blue-fish-box",
    name: "The Blue Fish Sandwich Box",
    category: "Boxed Lunches",
    image: null,
    quantity: 2,
    unitPriceCents: 999999, // intentionally wrong — server must ignore this
    lineTotalCents: 999999,
    selectedModifiers: [
      { modifierId: "m-extra", groupId: "g1", name: "spoofed", priceCents: 999999 },
    ],
    notes: "no onions",
    ...over,
  };
}

describe("repriceItems", () => {
  it("recomputes unit + line totals from catalog, ignoring client prices", () => {
    const { items, subtotalCents } = repriceItems([cartItem()], [product()]);
    expect(items).toHaveLength(1);
    // base 1200 + extra cheese 75 = 1275 unit; * qty 2 = 2550
    expect(items[0].unitPriceCents).toBe(1275);
    expect(items[0].lineTotalCents).toBe(2550);
    expect(items[0].name).toBe("The Blue Fish Sandwich Box");
    expect(items[0].selectedModifiers).toEqual([{ name: "Extra cheese", priceCents: 75 }]);
    expect(items[0].notes).toBe("no onions");
    expect(subtotalCents).toBe(2550);
  });

  it("throws on an unknown product id", () => {
    expect(() => repriceItems([cartItem({ productId: "nope" })], [product()])).toThrow(
      /Unknown catering product/
    );
  });

  it("throws on a modifier id that is not on the product", () => {
    const bad = cartItem({
      selectedModifiers: [{ modifierId: "m-ghost", groupId: "g1", name: "x", priceCents: 0 }],
    });
    expect(() => repriceItems([bad], [product()])).toThrow(/Invalid option/);
  });
});

describe("computeCateringTotals", () => {
  it("pickup: no delivery fee, taxes the subtotal at 10.25%", () => {
    const t = computeCateringTotals({ subtotalCents: 10_000, fulfillment: "pickup", taxExempt: false });
    expect(t.deliveryFeeCents).toBe(0);
    expect(t.taxCents).toBe(1025); // round(10000 * 0.1025)
    expect(t.totalCents).toBe(11_025);
  });

  it("delivery base tier adds $100 fee; tax is on subtotal only", () => {
    const t = computeCateringTotals({ subtotalCents: 50_000, fulfillment: "delivery", taxExempt: false });
    expect(t.deliveryFeeCents).toBe(10_000); // base tier
    expect(t.taxCents).toBe(5125); // round(50000 * 0.1025)
    expect(t.totalCents).toBe(50_000 + 10_000 + 5125);
  });

  it("tax-exempt zeroes tax but keeps delivery fee", () => {
    const t = computeCateringTotals({ subtotalCents: 120_000, fulfillment: "delivery", taxExempt: true });
    expect(t.deliveryFeeCents).toBe(15_000); // >= $1000 tier
    expect(t.taxCents).toBe(0);
    expect(t.totalCents).toBe(135_000);
  });
});

// A tray product carrying the "pick 2 types" group (min 2 / max 2).
const trayGroup: ModifierGroup = {
  id: "g-pick2", name: "Select 2 types", selectionType: "multiple",
  minSelect: 2, maxSelect: 2, sortOrder: 0,
  modifiers: [
    { id: "m1", name: "Turkey Club", priceCents: 0, isDefault: false, sortOrder: 0 },
    { id: "m2", name: "Buffalo Chicken", priceCents: 0, isDefault: false, sortOrder: 1 },
    { id: "m3", name: "Veggie", priceCents: 0, isDefault: false, sortOrder: 2 },
  ],
};
const trayProduct: Product = {
  id: "p-tray", slug: "catering-wrap-tray", name: "Mabe's Wrap Tray",
  description: null, basePriceCents: 12500, menu: "catering", category: "Trays",
  image: null, isAvailable: true, sortOrder: 0, variants: [], modifierGroups: [trayGroup],
};
const sel = (id: string) => ({ modifierId: id, groupId: "g-pick2", name: id, priceCents: 0 });
const trayItem = (mods: ReturnType<typeof sel>[]): CateringCartItem => ({
  lineId: "L1", productId: "p-tray", productSlug: "catering-wrap-tray",
  name: "Mabe's Wrap Tray", category: "Trays", image: null, quantity: 1,
  unitPriceCents: 12500, lineTotalCents: 12500, selectedModifiers: mods, notes: null,
});

describe("repriceItems modifier min/max enforcement", () => {
  it("accepts exactly 2 selections for a pick-2 tray", () => {
    const { subtotalCents } = repriceItems([trayItem([sel("m1"), sel("m2")])], [trayProduct]);
    expect(subtotalCents).toBe(12500);
  });
  it("rejects fewer than min (1 of 2)", () => {
    expect(() => repriceItems([trayItem([sel("m1")])], [trayProduct]))
      .toThrow(/Select 2 types/);
  });
  it("rejects more than max (3 of 2)", () => {
    expect(() => repriceItems([trayItem([sel("m1"), sel("m2"), sel("m3")])], [trayProduct]))
      .toThrow(/Select 2 types/);
  });
});
