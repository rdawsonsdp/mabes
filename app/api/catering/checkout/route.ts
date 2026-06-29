import { NextResponse } from "next/server";
import { catalog } from "@/app/lib/catalog/catalog";
import { repriceItems, computeCateringTotals } from "@/app/lib/catering/totals";
import { generateOrderNumber } from "@/app/lib/catering/order-number";
import { insertCateringOrder } from "@/app/lib/catering/orders";
import { sendCateringCustomerEmail } from "@/app/lib/email/catering-customer-template";
import { sendCateringStaffEmail } from "@/app/lib/email/catering-staff-template";
import { meetsMinimum, earliestEventDate, CATERING_LEAD_TIME_DAYS } from "@/app/lib/catering/config";
import type {
  CateringOrderInput,
  CateringOrderRecord,
  CateringOrderStatus,
} from "@/app/lib/catering/types";

function bad(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CateringOrderInput;

    // ---- shape + field validation ----
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return bad("Your catering cart is empty.");
    }
    if (!body.customer?.name?.trim()) return bad("Please provide a contact name.");
    if (!body.customer?.email?.trim() || !EMAIL_RE.test(body.customer.email)) {
      return bad("Please provide a valid email address.");
    }
    if (!body.customer?.phone?.trim()) return bad("Please provide a phone number.");
    if (!body.event?.date) return bad("Please choose an event date.");
    if (body.fulfillmentType === "delivery" && !body.deliveryAddress?.trim()) {
      return bad("A delivery address is required for delivery orders.");
    }

    // ---- 2-day lead time (server-authoritative) ----
    if (body.event.date < earliestEventDate()) {
      return bad(`Catering orders require at least ${CATERING_LEAD_TIME_DAYS} days advance notice.`);
    }

    // ---- re-price from catalog (never trust client prices) ----
    const products = await catalog.getCateringProducts();
    let priced;
    try {
      priced = repriceItems(body.items, products);
    } catch (e) {
      return bad(e instanceof Error ? e.message : "One or more items are no longer available.");
    }

    // ---- $60 minimum (server-authoritative) ----
    if (!meetsMinimum(priced.subtotalCents)) {
      return bad("Catering orders have a $60 minimum. Please add a few more items.");
    }

    // R2 reconciliation: object-arg form (canonical signature in config.ts)
    const totals = computeCateringTotals({
      subtotalCents: priced.subtotalCents,
      fulfillment: body.fulfillmentType,
      taxExempt: body.taxExempt,
    });

    const orderNumber = await generateOrderNumber();

    // ---- status / payment by path ----
    // Quote path: no payment. Paid path: pending_payment until Phase 5 (Braintree)
    // captures the transaction and flips this to paid/settled.
    const status: CateringOrderStatus = body.isQuote
      ? "quote_requested"
      : "pending_payment";

    const record = await insertCateringOrder({
      orderNumber,
      status,
      isQuote: body.isQuote,
      customerName: body.customer.name.trim(),
      customerEmail: body.customer.email.trim(),
      customerPhone: body.customer.phone?.trim() || null,
      company: body.customer.company?.trim() || null,
      eventDate: body.event.date,
      eventTime: body.event.time?.trim() || null,
      headcount: body.event.headcount ?? null,
      specialInstructions: body.event.specialInstructions?.trim() || null,
      fulfillmentType: body.fulfillmentType,
      deliveryAddress: body.fulfillmentType === "delivery" ? body.deliveryAddress!.trim() : null,
      subtotalCents: totals.subtotalCents,
      deliveryFeeCents: totals.deliveryFeeCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      taxExempt: body.taxExempt,
      taxExemptCertificateUrl: body.taxExemptCertificateUrl ?? null,
      paymentProvider: "braintree",
      paymentTransactionId: null,
      paymentStatus: "none",
      items: priced.items,
      adminNotes: null,
    });

    // ---- emails (non-blocking, mirrors LB try/catch-and-continue) ----
    await sendCateringEmails(record);

    return NextResponse.json({ success: true, order: record });
  } catch (error) {
    console.error("Catering checkout failed:", error);
    return bad(error instanceof Error ? error.message : "Something went wrong.", 500);
  }
}

async function sendCateringEmails(order: CateringOrderRecord): Promise<void> {
  try {
    await sendCateringCustomerEmail(order);
  } catch (e) {
    console.error("Customer email failed (non-blocking):", e);
  }
  try {
    await sendCateringStaffEmail(order);
  } catch (e) {
    console.error("Staff email failed (non-blocking):", e);
  }
}
