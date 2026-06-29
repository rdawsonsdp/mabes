import { describe, it, expect, vi, beforeEach } from "vitest";

const order = vi.fn();
const eq = vi.fn();
const select = vi.fn();
const from = vi.fn();

vi.mock("@/app/lib/supabase/server", () => ({
  getSupabase: () => ({ from }),
  usingServiceRole: true,
}));

import { listCateringOrders, mapCateringOrderRow } from "./admin-queries";

const SAMPLE_ROW = {
  id: "11111111-1111-1111-1111-111111111111",
  order_number: "MB-1042",
  status: "paid",
  is_quote: false,
  customer_name: "Connie B.",
  customer_email: "connie@example.com",
  customer_phone: "773-555-0100",
  company: "Chatham Group",
  event_date: "2026-07-04",
  event_time: "12:00",
  headcount: 25,
  special_instructions: "Door code 1234",
  fulfillment_type: "delivery",
  delivery_address: "5 Main St",
  subtotal_cents: 25000,
  delivery_fee_cents: 10000,
  tax_cents: 2563,
  total_cents: 37563,
  tax_exempt: false,
  tax_exempt_certificate_url: null,
  payment_provider: "braintree",
  payment_transaction_id: "txn_1",
  payment_status: "settled",
  items: [{ productId: "p1", name: "Wrap Tray", quantity: 2, unitPriceCents: 12500, lineTotalCents: 25000, selectedModifiers: [], notes: null }],
  admin_notes: null,
  created_at: "2026-06-29T10:00:00Z",
  updated_at: "2026-06-29T10:00:00Z",
};

beforeEach(() => {
  order.mockReset();
  eq.mockReset();
  select.mockReset();
  from.mockReset();
  // chain: from(...).select(...).order(...) [.eq(...)]
  order.mockReturnValue({ eq });
  select.mockReturnValue({ order });
  from.mockReturnValue({ select });
});

describe("mapCateringOrderRow", () => {
  it("maps snake_case columns to the CateringOrderRecord shape", () => {
    const r = mapCateringOrderRow(SAMPLE_ROW);
    expect(r.orderNumber).toBe("MB-1042");
    expect(r.isQuote).toBe(false);
    expect(r.totalCents).toBe(37563);
    expect(r.fulfillmentType).toBe("delivery");
    expect(r.items).toHaveLength(1);
    expect(r.taxExemptCertificateUrl).toBeNull();
  });
});

describe("listCateringOrders", () => {
  it("orders newest-first and maps rows (no status filter)", async () => {
    order.mockReturnValue({ eq, data: [SAMPLE_ROW], error: null });
    // Without a filter, listCateringOrders awaits the order() result directly.
    const result = await listCateringOrders();
    expect(from).toHaveBeenCalledWith("catering_orders");
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result[0].orderNumber).toBe("MB-1042");
  });

  it("applies a status filter via eq()", async () => {
    eq.mockResolvedValue({ data: [SAMPLE_ROW], error: null });
    const result = await listCateringOrders({ status: "paid" });
    expect(eq).toHaveBeenCalledWith("status", "paid");
    expect(result).toHaveLength(1);
  });

  it("throws a clear error on a Supabase failure", async () => {
    eq.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(listCateringOrders({ status: "paid" })).rejects.toThrow(
      "Catering orders load failed: boom"
    );
  });
});
