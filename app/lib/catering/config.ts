// OPEN VALUES — confirm with Connie before launch (design §12). Single source.
import type { FulfillmentType, CateringTotals } from "./types";

export const CATERING_MINIMUM_CENTS = 6_000; // $60 order minimum (BentoBox rule)
export const CATERING_LEAD_TIME_DAYS = 2; // 2-day advance notice
export const SALES_TAX_RATE = 0.1025; // Chicago 10.25% — PROPOSED default

// Per-person catering items (individual boxed meals) are priced per guest with a
// minimum guest count. Trays / Add-Ons are flat-priced and not per-person.
export const PER_PERSON_MIN_GUESTS = 10;
export const PER_PERSON_CATEGORIES = ["Boxed Lunches", "Wraps"];
export function isPerPersonCategory(category: string): boolean {
  return PER_PERSON_CATEGORIES.includes(category);
}

export const DELIVERY_FEE_TIERS_CENTS: { minSubtotalCents: number; feeCents: number }[] = [
  { minSubtotalCents: 200_000, feeCents: 25_000 }, // ≥ $2000 → $250  (LB-style)
  { minSubtotalCents: 100_000, feeCents: 15_000 }, // ≥ $1000 → $150
  { minSubtotalCents: 0, feeCents: 10_000 }, // base → $100
];

export function deliveryFeeCents(subtotalCents: number, fulfillment: FulfillmentType): number {
  if (fulfillment === "pickup") return 0;
  for (const t of DELIVERY_FEE_TIERS_CENTS) {
    if (subtotalCents >= t.minSubtotalCents) return t.feeCents;
  }
  return 0;
}

export function taxCents(taxableCents: number, taxExempt: boolean): number {
  if (taxExempt) return 0;
  return Math.round(taxableCents * SALES_TAX_RATE);
}

export function meetsMinimum(subtotalCents: number): boolean {
  return subtotalCents >= CATERING_MINIMUM_CENTS;
}

/** The sales-tax rate as a display string, e.g. "10.25%". */
export function taxRatePercentLabel(): string {
  return `${(SALES_TAX_RATE * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
}

/** Earliest selectable event date (today + lead time), yyyy-mm-dd. */
export function earliestEventDate(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + CATERING_LEAD_TIME_DAYS);
  return d.toISOString().slice(0, 10);
}

/** Single source of the money breakdown. Tax base = subtotal (no setup fee; delivery untaxed). */
export function computeCateringTotals(args: {
  subtotalCents: number;
  fulfillment: FulfillmentType;
  taxExempt: boolean;
}): CateringTotals {
  const subtotalCents = args.subtotalCents;
  const deliveryFee = deliveryFeeCents(subtotalCents, args.fulfillment);
  const tax = taxCents(subtotalCents, args.taxExempt);
  return {
    subtotalCents,
    deliveryFeeCents: deliveryFee,
    taxCents: tax,
    totalCents: subtotalCents + deliveryFee + tax,
  };
}
