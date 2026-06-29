import { describe, it, expect } from "vitest";
import { cateringCartReducer, recompute, MAX_CATERING_QTY } from "./cart-reducer";
import { EMPTY_CATERING_CART } from "./types";
import type { CateringCartAction } from "./types";

function addItem(
  over: { item?: Partial<import("./types").CateringCartItem> } & Record<string, unknown> = {}
): CateringCartAction {
  const { item: itemOver, ...actionOver } = over;
  return {
    type: "ADD_ITEM",
    item: {
      productId: "p-blue-fish",
      productSlug: "catering-the-blue-fish-box",
      name: "The Blue Fish Sandwich Box",
      category: "Boxed Lunches",
      image: null,
      quantity: 1,
      unitPriceCents: 1_200,
      selectedModifiers: [],
      notes: null,
      ...(itemOver ?? {}),
    },
    ...actionOver,
  } as CateringCartAction;
}

describe("cateringCartReducer ADD_ITEM", () => {
  it("adds a new line, assigns a lineId, and computes line total + totals", () => {
    const s = cateringCartReducer(EMPTY_CATERING_CART, addItem());
    expect(s.items).toHaveLength(1);
    expect(typeof s.items[0].lineId).toBe("string");
    expect(s.items[0].lineId.length).toBeGreaterThan(0);
    expect(s.items[0].lineTotalCents).toBe(1_200);
    expect(s.subtotalCents).toBe(1_200);
    expect(s.itemCount).toBe(1);
  });

  it("merges identical configurations onto one line", () => {
    let s = cateringCartReducer(EMPTY_CATERING_CART, addItem());
    s = cateringCartReducer(s, addItem());
    expect(s.items).toHaveLength(1);
    expect(s.items[0].quantity).toBe(2);
    expect(s.subtotalCents).toBe(2_400);
    expect(s.itemCount).toBe(2);
  });

  it("keeps separate lines when modifiers differ", () => {
    let s = cateringCartReducer(EMPTY_CATERING_CART, {
      type: "ADD_ITEM",
      item: {
        productId: "p-club", productSlug: "x", name: "Club", category: "Boxed Lunches",
        image: null, quantity: 1, unitPriceCents: 1_450,
        selectedModifiers: [{ modifierId: "m-swiss", groupId: "g-cheese", name: "Swiss", priceCents: 0 }],
        notes: null,
      },
    });
    s = cateringCartReducer(s, {
      type: "ADD_ITEM",
      item: {
        productId: "p-club", productSlug: "x", name: "Club", category: "Boxed Lunches",
        image: null, quantity: 1, unitPriceCents: 1_450,
        selectedModifiers: [{ modifierId: "m-cheddar", groupId: "g-cheese", name: "Cheddar", priceCents: 0 }],
        notes: null,
      },
    });
    expect(s.items).toHaveLength(2);
    expect(s.subtotalCents).toBe(2_900);
  });

  it("clamps merged quantity to MAX_CATERING_QTY", () => {
    let s = cateringCartReducer(EMPTY_CATERING_CART, addItem({ item: { quantity: 98 } } as never));
    s = cateringCartReducer(s, addItem({ item: { quantity: 5 } } as never));
    expect(s.items[0].quantity).toBe(MAX_CATERING_QTY);
  });
});

describe("cateringCartReducer UPDATE_QTY / REMOVE_ITEM", () => {
  it("updates quantity and recomputes totals", () => {
    const added = cateringCartReducer(EMPTY_CATERING_CART, addItem());
    const lineId = added.items[0].lineId;
    const s = cateringCartReducer(added, { type: "UPDATE_QTY", lineId, quantity: 3 });
    expect(s.items[0].quantity).toBe(3);
    expect(s.subtotalCents).toBe(3_600);
    expect(s.itemCount).toBe(3);
  });

  it("removes the line when quantity drops to 0", () => {
    const added = cateringCartReducer(EMPTY_CATERING_CART, addItem());
    const lineId = added.items[0].lineId;
    const s = cateringCartReducer(added, { type: "UPDATE_QTY", lineId, quantity: 0 });
    expect(s.items).toHaveLength(0);
    expect(s.subtotalCents).toBe(0);
    expect(s.itemCount).toBe(0);
  });

  it("REMOVE_ITEM drops the matching line", () => {
    const added = cateringCartReducer(EMPTY_CATERING_CART, addItem());
    const lineId = added.items[0].lineId;
    const s = cateringCartReducer(added, { type: "REMOVE_ITEM", lineId });
    expect(s.items).toHaveLength(0);
  });
});

describe("cateringCartReducer fulfillment / event / clear / hydrate", () => {
  it("SET_FULFILLMENT switches type without touching items", () => {
    const added = cateringCartReducer(EMPTY_CATERING_CART, addItem());
    const s = cateringCartReducer(added, { type: "SET_FULFILLMENT", fulfillmentType: "delivery" });
    expect(s.fulfillmentType).toBe("delivery");
    expect(s.items).toHaveLength(1);
  });

  it("SET_EVENT stores date + time", () => {
    const s = cateringCartReducer(EMPTY_CATERING_CART, {
      type: "SET_EVENT", eventDate: "2026-07-04", eventTime: "12:00",
    });
    expect(s.eventDate).toBe("2026-07-04");
    expect(s.eventTime).toBe("12:00");
  });

  it("CLEAR empties items and totals but keeps fulfillment/event", () => {
    let s = cateringCartReducer(EMPTY_CATERING_CART, { type: "SET_FULFILLMENT", fulfillmentType: "delivery" });
    s = cateringCartReducer(s, addItem());
    s = cateringCartReducer(s, { type: "CLEAR" });
    expect(s.items).toHaveLength(0);
    expect(s.subtotalCents).toBe(0);
    expect(s.fulfillmentType).toBe("delivery");
  });

  it("HYDRATE recomputes totals from a restored snapshot", () => {
    const s = cateringCartReducer(EMPTY_CATERING_CART, {
      type: "HYDRATE",
      state: {
        ...EMPTY_CATERING_CART,
        items: [{
          lineId: "L1", productId: "p", productSlug: "s", name: "X", category: "Trays",
          image: null, quantity: 2, unitPriceCents: 12_500, lineTotalCents: 0,
          selectedModifiers: [], notes: null,
        }],
      },
    });
    expect(s.items[0].lineTotalCents).toBe(25_000);
    expect(s.subtotalCents).toBe(25_000);
    expect(s.itemCount).toBe(2);
  });
});

describe("recompute", () => {
  it("is idempotent on derived fields", () => {
    const added = cateringCartReducer(EMPTY_CATERING_CART, addItem());
    expect(recompute(added)).toEqual(added);
  });
});
