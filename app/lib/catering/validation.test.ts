import { describe, it, expect } from "vitest";
import {
  validateMinimum,
  validateLeadTime,
  validateModifierGroup,
  validateModifierSelection,
  canCheckout,
} from "./validation";
import { EMPTY_CATERING_CART } from "./types";
import type { ModifierGroup } from "@/app/lib/types";

const NOW = new Date("2026-06-29T12:00:00Z"); // earliest = 2026-07-01

function group(over: Partial<ModifierGroup> = {}): ModifierGroup {
  return {
    id: "g-tray",
    name: "Select 2 types",
    selectionType: "multiple",
    minSelect: 2,
    maxSelect: 2,
    sortOrder: 0,
    modifiers: [
      { id: "m1", name: "Turkey Club", priceCents: 0, isDefault: false, sortOrder: 0 },
      { id: "m2", name: "Blue Fish", priceCents: 0, isDefault: false, sortOrder: 1 },
      { id: "m3", name: "Veggie", priceCents: 0, isDefault: false, sortOrder: 2 },
    ],
    ...over,
  };
}

describe("validateMinimum (enforces $60 minimum)", () => {
  it("fails below $60 with a shortfall message", () => {
    const r = validateMinimum(4_000);
    expect(r.ok).toBe(false);
    expect(r.message).toContain("$60.00");
    expect(r.message).toContain("$20.00"); // shortfall
  });
  it("passes at $60", () => {
    expect(validateMinimum(6_000)).toEqual({ ok: true, message: null });
  });
});

describe("validateLeadTime (2-day lead time)", () => {
  it("requires a date", () => {
    expect(validateLeadTime(null, NOW).ok).toBe(false);
  });
  it("rejects dates inside the lead window", () => {
    const r = validateLeadTime("2026-06-30", NOW);
    expect(r.ok).toBe(false);
    expect(r.message).toContain("2026-07-01");
  });
  it("accepts the earliest valid date", () => {
    expect(validateLeadTime("2026-07-01", NOW)).toEqual({ ok: true, message: null });
  });
  it("accepts later dates", () => {
    expect(validateLeadTime("2026-08-15", NOW).ok).toBe(true);
  });
});

describe("validateModifierGroup (tray 'pick exactly 2')", () => {
  it("fails with too few selected", () => {
    const r = validateModifierGroup(group(), 1);
    expect(r.ok).toBe(false);
    expect(r.message).toContain("exactly 2");
  });
  it("passes with exactly 2", () => {
    expect(validateModifierGroup(group(), 2)).toEqual({ ok: true, message: null });
  });
  it("fails with too many", () => {
    const r = validateModifierGroup(group(), 3);
    expect(r.ok).toBe(false);
    expect(r.message).toContain("exactly 2");
  });
  it("single-select required group needs one", () => {
    const cheese = group({
      id: "g-cheese", name: "Choice of cheese", selectionType: "single", minSelect: 1, maxSelect: 1,
    });
    expect(validateModifierGroup(cheese, 0).ok).toBe(false);
    expect(validateModifierGroup(cheese, 1).ok).toBe(true);
  });
  it("optional group (min 0) passes with nothing selected", () => {
    const opt = group({ id: "g-opt", minSelect: 0, maxSelect: 3 });
    expect(validateModifierGroup(opt, 0).ok).toBe(true);
  });
});

describe("validateModifierSelection (whole modal)", () => {
  it("aggregates per-group results", () => {
    const tray = group();
    const res = validateModifierSelection([tray], new Set(["m1"]));
    expect(res.ok).toBe(false);
    expect(res.byGroup["g-tray"].ok).toBe(false);
  });
  it("passes when every group is satisfied", () => {
    const tray = group();
    const res = validateModifierSelection([tray], new Set(["m1", "m2"]));
    expect(res.ok).toBe(true);
    expect(res.byGroup["g-tray"].ok).toBe(true);
  });
});

describe("canCheckout", () => {
  it("blocks an empty cart", () => {
    expect(canCheckout(EMPTY_CATERING_CART, NOW).ok).toBe(false);
  });
  it("blocks when under minimum", () => {
    const state = { ...EMPTY_CATERING_CART, items: [{} as never], subtotalCents: 4_000, eventDate: "2026-07-05" };
    const r = canCheckout(state, NOW);
    expect(r.ok).toBe(false);
    expect(r.message).toContain("$60.00");
  });
  it("blocks when lead time not met", () => {
    const state = { ...EMPTY_CATERING_CART, items: [{} as never], subtotalCents: 12_500, eventDate: "2026-06-30" };
    expect(canCheckout(state, NOW).ok).toBe(false);
  });
  it("passes when over minimum and lead time met", () => {
    const state = { ...EMPTY_CATERING_CART, items: [{} as never], subtotalCents: 12_500, eventDate: "2026-07-05" };
    expect(canCheckout(state, NOW)).toEqual({ ok: true, message: null });
  });
});
