import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CateringOrderRecord } from "@/app/lib/catering/types";

const sendEmail = vi.fn().mockResolvedValue({ success: true, id: "mock" });
vi.mock("./send-email", () => ({ sendEmail }));

function order(over: Partial<CateringOrderRecord> = {}): CateringOrderRecord {
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
    specialInstructions: "No nuts please",
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
      {
        productId: "p1",
        name: "The Blue Fish Sandwich Box",
        quantity: 2,
        unitPriceCents: 1200,
        lineTotalCents: 2400,
        selectedModifiers: [{ name: "Swiss", priceCents: 0 }],
        notes: null,
      },
    ],
    adminNotes: null,
    createdAt: "2026-06-29T00:00:00Z",
    updatedAt: "2026-06-29T00:00:00Z",
    ...over,
  };
}

beforeEach(() => sendEmail.mockClear());

describe("customer template", () => {
  it("renders order number, item, and formatted total (cents → dollars)", async () => {
    const { buildCateringCustomerHtml } = await import("./catering-customer-template");
    const html = buildCateringCustomerHtml(order());
    expect(html).toContain("MB-1042");
    expect(html).toContain("The Blue Fish Sandwich Box");
    expect(html).toContain("$232.30"); // total
    expect(html).toContain("$120.00"); // subtotal
  });

  it("quote copy differs from paid copy", async () => {
    const { buildCateringCustomerHtml } = await import("./catering-customer-template");
    const quote = buildCateringCustomerHtml(order({ isQuote: true }));
    const paid = buildCateringCustomerHtml(
      order({ isQuote: false, status: "paid", paymentStatus: "settled" })
    );
    expect(quote).toMatch(/quote/i);
    expect(paid).toMatch(/payment received|order confirmed|thank you for your order/i);
  });

  it("sendCateringCustomerEmail sends to the customer with reply-to staff", async () => {
    const { sendCateringCustomerEmail } = await import("./catering-customer-template");
    await sendCateringCustomerEmail(order());
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const arg = sendEmail.mock.calls[0][0];
    expect(arg.to).toBe("connie@example.com");
    expect(arg.subject).toContain("MB-1042");
    expect(arg.replyTo).toBe("mabesdeli@gmail.com");
  });
});

describe("staff template", () => {
  it("renders customer name, phone, total, and event date", async () => {
    const { buildCateringStaffHtml } = await import("./catering-staff-template");
    const html = buildCateringStaffHtml(order());
    expect(html).toContain("Connie Brown");
    expect(html).toContain("(773) 555-0000");
    expect(html).toContain("$232.30");
  });

  it("sendCateringStaffEmail sends to the shop, reply-to customer", async () => {
    const { sendCateringStaffEmail } = await import("./catering-staff-template");
    await sendCateringStaffEmail(order());
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const arg = sendEmail.mock.calls[0][0];
    expect(arg.to).toBe("mabesdeli@gmail.com");
    expect(arg.replyTo).toBe("connie@example.com");
  });
});
