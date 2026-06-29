import { describe, it, expect, vi, beforeEach } from "vitest";

// A row shaped like the DB returns it (snake_case).
const dbRow = {
  id: "uuid-1",
  order_number: "MB-1042",
  status: "quote_requested",
  is_quote: true,
  customer_name: "Connie B",
  customer_email: "c@example.com",
  customer_phone: "773-555-0000",
  company: "Mabe's Office",
  event_date: "2026-07-10",
  event_time: "12:00",
  headcount: 20,
  special_instructions: "no nuts",
  fulfillment_type: "delivery",
  delivery_address: "1 State St, Chicago, IL",
  subtotal_cents: 12000,
  delivery_fee_cents: 10000,
  tax_cents: 1230,
  total_cents: 23230,
  tax_exempt: false,
  tax_exempt_certificate_url: null,
  payment_provider: "braintree",
  payment_transaction_id: null,
  payment_status: "none",
  items: [{ productId: "p1", name: "Box", quantity: 1, unitPriceCents: 12000, lineTotalCents: 12000, selectedModifiers: [], notes: null }],
  admin_notes: null,
  created_at: "2026-06-29T00:00:00Z",
  updated_at: "2026-06-29T00:00:00Z",
};

// Capture the payload passed to .insert / .update for assertions.
const captured: { insert?: unknown; update?: unknown } = {};

function makeClient(returnRow: typeof dbRow | null) {
  const single = vi.fn().mockResolvedValue({ data: returnRow, error: null });
  const maybeSingle = vi.fn().mockResolvedValue({ data: returnRow, error: null });
  const selectAfterWrite = vi.fn(() => ({ single }));
  const eqSelect = vi.fn(() => ({ maybeSingle }));
  const selectRead = vi.fn(() => ({ eq: eqSelect }));
  const eqUpdate = vi.fn(() => ({ select: selectAfterWrite }));
  const insert = vi.fn((payload: unknown) => {
    captured.insert = payload;
    return { select: selectAfterWrite };
  });
  const update = vi.fn((payload: unknown) => {
    captured.update = payload;
    return { eq: eqUpdate };
  });
  const from = vi.fn(() => ({ insert, update, select: selectRead }));
  return { from };
}

let client = makeClient(dbRow);
vi.mock("@/app/lib/supabase/server", () => ({ getSupabase: () => client }));

beforeEach(() => {
  client = makeClient(dbRow);
  captured.insert = undefined;
  captured.update = undefined;
});

describe("orders data layer", () => {
  it("insertCateringOrder maps camelCase → snake_case and returns a record", async () => {
    const { insertCateringOrder } = await import("./orders");
    const rec = await insertCateringOrder({
      orderNumber: "MB-1042",
      status: "quote_requested",
      isQuote: true,
      customerName: "Connie B",
      customerEmail: "c@example.com",
      customerPhone: "773-555-0000",
      company: "Mabe's Office",
      eventDate: "2026-07-10",
      eventTime: "12:00",
      headcount: 20,
      specialInstructions: "no nuts",
      fulfillmentType: "delivery",
      deliveryAddress: "1 State St, Chicago, IL",
      subtotalCents: 12000,
      deliveryFeeCents: 10000,
      taxCents: 1230,
      totalCents: 23230,
      taxExempt: false,
      taxExemptCertificateUrl: null,
      paymentProvider: "braintree",
      paymentTransactionId: null,
      paymentStatus: "none",
      items: dbRow.items,
      adminNotes: null,
    });
    expect(rec.orderNumber).toBe("MB-1042");
    expect(rec.totalCents).toBe(23230);
    const payload = captured.insert as Record<string, unknown>;
    expect(payload.order_number).toBe("MB-1042");
    expect(payload.fulfillment_type).toBe("delivery");
    expect(payload.subtotal_cents).toBe(12000);
  });

  it("getCateringOrder returns null when the row is missing", async () => {
    client = makeClient(null);
    const { getCateringOrder } = await import("./orders");
    expect(await getCateringOrder("missing")).toBeNull();
  });

  it("updateCateringOrderStatus writes status and returns the row", async () => {
    const { updateCateringOrderStatus } = await import("./orders");
    const rec = await updateCateringOrderStatus("uuid-1", "confirmed");
    expect((captured.update as Record<string, unknown>).status).toBe("confirmed");
    expect(rec.id).toBe("uuid-1");
  });
});
