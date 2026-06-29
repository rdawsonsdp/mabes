import { describe, it, expect } from "vitest";
import {
  CATERING_MINIMUM_CENTS,
  CATERING_LEAD_TIME_DAYS,
  deliveryFeeCents,
  taxCents,
  meetsMinimum,
  earliestEventDate,
  computeCateringTotals,
} from "./config";

describe("meetsMinimum ($60 gate)", () => {
  it("is false below $60", () => {
    expect(meetsMinimum(5_999)).toBe(false);
  });
  it("is true at exactly $60", () => {
    expect(meetsMinimum(CATERING_MINIMUM_CENTS)).toBe(true);
    expect(meetsMinimum(6_000)).toBe(true);
  });
  it("is true above $60", () => {
    expect(meetsMinimum(12_500)).toBe(true);
  });
});

describe("deliveryFeeCents", () => {
  it("is 0 for pickup regardless of subtotal", () => {
    expect(deliveryFeeCents(500_000, "pickup")).toBe(0);
  });
  it("is $100 base for small delivery orders", () => {
    expect(deliveryFeeCents(6_000, "delivery")).toBe(10_000);
    expect(deliveryFeeCents(99_999, "delivery")).toBe(10_000);
  });
  it("is $150 at >= $1000", () => {
    expect(deliveryFeeCents(100_000, "delivery")).toBe(15_000);
    expect(deliveryFeeCents(199_999, "delivery")).toBe(15_000);
  });
  it("is $250 at >= $2000", () => {
    expect(deliveryFeeCents(200_000, "delivery")).toBe(25_000);
  });
});

describe("taxCents (Chicago 10.25%, rounded)", () => {
  it("taxes the taxable base", () => {
    expect(taxCents(12_500, false)).toBe(1_281); // 12500 * 0.1025 = 1281.25 -> 1281
  });
  it("is 0 when tax-exempt", () => {
    expect(taxCents(12_500, true)).toBe(0);
  });
  it("rounds to the nearest cent", () => {
    expect(taxCents(10_000, false)).toBe(1_025);
  });
});

describe("earliestEventDate (2-day lead time)", () => {
  it("returns today + lead-time days as yyyy-mm-dd", () => {
    const now = new Date("2026-06-29T12:00:00Z");
    expect(earliestEventDate(now)).toBe("2026-07-01");
    expect(CATERING_LEAD_TIME_DAYS).toBe(2);
  });
  it("rolls over month boundaries", () => {
    expect(earliestEventDate(new Date("2026-06-30T00:00:00Z"))).toBe("2026-07-02");
  });
});

describe("computeCateringTotals", () => {
  it("pickup: total = subtotal + tax, no delivery fee", () => {
    expect(computeCateringTotals({ subtotalCents: 12_500, fulfillment: "pickup", taxExempt: false })).toEqual({
      subtotalCents: 12_500,
      deliveryFeeCents: 0,
      taxCents: 1_281,
      totalCents: 13_781,
    });
  });
  it("delivery: adds the tier fee but does not tax it", () => {
    expect(computeCateringTotals({ subtotalCents: 100_000, fulfillment: "delivery", taxExempt: false })).toEqual({
      subtotalCents: 100_000,
      deliveryFeeCents: 15_000,
      taxCents: 10_250,
      totalCents: 125_250,
    });
  });
  it("tax-exempt zeroes only the tax", () => {
    expect(computeCateringTotals({ subtotalCents: 100_000, fulfillment: "delivery", taxExempt: true })).toEqual({
      subtotalCents: 100_000,
      deliveryFeeCents: 15_000,
      taxCents: 0,
      totalCents: 115_000,
    });
  });
});
