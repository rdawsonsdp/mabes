import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Product } from "@/app/lib/types";

const product: Product = {
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
  modifierGroups: [],
};

const getCateringProducts = vi.fn().mockResolvedValue([product]);
vi.mock("@/app/lib/catalog/catalog", () => ({
  catalog: { getCateringProducts },
}));

const generateOrderNumber = vi.fn().mockResolvedValue("MB-1042");
vi.mock("@/app/lib/catering/order-number", () => ({ generateOrderNumber }));

const insertCateringOrder = vi.fn();
vi.mock("@/app/lib/catering/orders", () => ({ insertCateringOrder }));

const sendCateringCustomerEmail = vi.fn().mockResolvedValue({ success: true });
const sendCateringStaffEmail = vi.fn().mockResolvedValue({ success: true });
vi.mock("@/app/lib/email/catering-customer-template", () => ({ sendCateringCustomerEmail }));
vi.mock("@/app/lib/email/catering-staff-template", () => ({ sendCateringStaffEmail }));

// Use a fixed "today" so lead-time validation is deterministic.
const REAL_NOW = Date.now;

function lineItem(qty = 6) {
  return {
    lineId: "l1",
    productId: "p1",
    productSlug: "catering-the-blue-fish-box",
    name: "The Blue Fish Sandwich Box",
    category: "Boxed Lunches",
    image: null,
    quantity: qty,
    unitPriceCents: 9999,
    lineTotalCents: 9999 * qty,
    selectedModifiers: [],
    notes: null,
  };
}

function input(over: Record<string, unknown> = {}) {
  return {
    isQuote: true,
    fulfillmentType: "pickup",
    customer: { name: "Connie Brown", email: "c@example.com", phone: "773-555-0000", company: null },
    event: { date: "2030-01-10", time: "12:00", headcount: 12, specialInstructions: null },
    deliveryAddress: null,
    taxExempt: false,
    taxExemptCertificateUrl: null,
    items: [lineItem(6)], // 6 * $12 = $72 → over the $60 minimum
    paymentNonce: null,
    ...over,
  };
}

function req(body: unknown): Request {
  return new Request("http://localhost/api/catering/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  Date.now = REAL_NOW;
  getCateringProducts.mockResolvedValue([product]);
  generateOrderNumber.mockResolvedValue("MB-1042");
  // insert echoes back a record built from the payload it receives.
  insertCateringOrder.mockImplementation(async (rec) => ({
    ...rec,
    id: "uuid-1",
    createdAt: "2026-06-29T00:00:00Z",
    updatedAt: "2026-06-29T00:00:00Z",
  }));
});

describe("POST /api/catering/checkout", () => {
  it("persists a quote (is_quote true, status quote_requested) and sends both emails", async () => {
    const { POST } = await import("./route");
    const res = await POST(req(input()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.order.orderNumber).toBe("MB-1042");
    expect(body.order.isQuote).toBe(true);
    expect(body.order.status).toBe("quote_requested");
    expect(body.order.paymentStatus).toBe("none");
    // Server-recomputed totals: subtotal 7200, pickup fee 0, tax 738
    expect(body.order.subtotalCents).toBe(7200);
    expect(body.order.deliveryFeeCents).toBe(0);
    expect(body.order.taxCents).toBe(738);
    expect(body.order.totalCents).toBe(7938);
    expect(sendCateringCustomerEmail).toHaveBeenCalledTimes(1);
    expect(sendCateringStaffEmail).toHaveBeenCalledTimes(1);
  });

  it("rejects when subtotal is below the $60 minimum", async () => {
    const { POST } = await import("./route");
    const res = await POST(req(input({ items: [lineItem(1)] }))); // $12 only
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/minimum/i);
    expect(insertCateringOrder).not.toHaveBeenCalled();
  });

  it("rejects an event date inside the 2-day lead time", async () => {
    const { POST } = await import("./route");
    const res = await POST(req(input({ event: { date: "2020-01-01", time: "12:00", headcount: 12, specialInstructions: null } })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/2 days|advance|lead/i);
  });

  it("requires a delivery address for delivery orders", async () => {
    const { POST } = await import("./route");
    const res = await POST(req(input({ fulfillmentType: "delivery", deliveryAddress: null })));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/address/i);
  });

  it("paid path (paymentNonce present) persists pending_payment", async () => {
    const { POST } = await import("./route");
    const res = await POST(req(input({ isQuote: false, paymentNonce: "fake-nonce" })));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.order.isQuote).toBe(false);
    expect(body.order.status).toBe("pending_payment");
    expect(body.order.paymentStatus).toBe("none");
  });

  it("still succeeds when email sending throws (non-blocking)", async () => {
    sendCateringCustomerEmail.mockRejectedValueOnce(new Error("resend down"));
    const { POST } = await import("./route");
    const res = await POST(req(input()));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});
