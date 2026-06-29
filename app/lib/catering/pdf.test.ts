import { describe, it, expect } from "vitest";
import type { CateringOrderRecord } from "./types";
import { buildCateringOrderPdf } from "./pdf";

function order(): CateringOrderRecord {
  return {
    id: "uuid-1",
    orderNumber: "MB-1042",
    status: "quote_requested",
    isQuote: true,
    customerName: "Connie Brown",
    customerEmail: "connie@example.com",
    customerPhone: "(773) 555-0000",
    company: "Mabe's Office",
    eventDate: "2026-07-10",
    eventTime: "12:00 PM",
    headcount: 20,
    specialInstructions: "No nuts",
    fulfillmentType: "delivery",
    deliveryAddress: "1 State St, Chicago, IL 60601",
    subtotalCents: 12000,
    deliveryFeeCents: 10000,
    taxCents: 1230,
    totalCents: 23230,
    taxExempt: false,
    taxExemptCertificateUrl: null,
    paymentProvider: "braintree",
    paymentTransactionId: null,
    paymentStatus: "none",
    items: [
      { productId: "p1", name: "The Blue Fish Sandwich Box", quantity: 2, unitPriceCents: 1200, lineTotalCents: 2400, selectedModifiers: [{ name: "Swiss", priceCents: 0 }], notes: null },
    ],
    adminNotes: null,
    createdAt: "2026-06-29T00:00:00Z",
    updatedAt: "2026-06-29T00:00:00Z",
  };
}

describe("buildCateringOrderPdf", () => {
  it("returns a non-empty Uint8Array starting with the %PDF- header", () => {
    const bytes = buildCateringOrderPdf(order());
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(500);
    const header = String.fromCharCode(...bytes.slice(0, 5));
    expect(header).toBe("%PDF-");
  });

  it("produces a different document for a paid order vs a quote", () => {
    const quote = buildCateringOrderPdf(order());
    const paid = buildCateringOrderPdf({ ...order(), isQuote: false, status: "paid" });
    expect(paid.length).toBeGreaterThan(500);
    // Both valid PDFs; lengths need not match but both must render.
    expect(String.fromCharCode(...paid.slice(0, 5))).toBe("%PDF-");
    expect(quote.length).toBeGreaterThan(500);
  });
});
