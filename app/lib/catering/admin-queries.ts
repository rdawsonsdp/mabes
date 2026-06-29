import { getSupabase } from "@/app/lib/supabase/server";
import type {
  CateringOrderRecord,
  CateringOrderStatus,
  CateringPaymentStatus,
  CateringOrderItemSnapshot,
  FulfillmentType,
} from "@/app/lib/catering/types";

// Mirrors the catering_orders columns (FOUNDATIONS §4).
const COLUMNS =
  "id, order_number, status, is_quote, customer_name, customer_email, customer_phone, company, " +
  "event_date, event_time, headcount, special_instructions, fulfillment_type, delivery_address, " +
  "subtotal_cents, delivery_fee_cents, tax_cents, total_cents, tax_exempt, tax_exempt_certificate_url, " +
  "payment_provider, payment_transaction_id, payment_status, items, admin_notes, created_at, updated_at";

type Row = Record<string, unknown>;

/** Map a catering_orders DB row → the app's CateringOrderRecord (FOUNDATIONS §3). */
export function mapCateringOrderRow(row: Row): CateringOrderRecord {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    status: row.status as CateringOrderStatus,
    isQuote: Boolean(row.is_quote),
    customerName: String(row.customer_name ?? ""),
    customerEmail: String(row.customer_email ?? ""),
    customerPhone: (row.customer_phone as string | null) ?? null,
    company: (row.company as string | null) ?? null,
    eventDate: (row.event_date as string | null) ?? null,
    eventTime: (row.event_time as string | null) ?? null,
    headcount: (row.headcount as number | null) ?? null,
    specialInstructions: (row.special_instructions as string | null) ?? null,
    fulfillmentType: row.fulfillment_type as FulfillmentType,
    deliveryAddress: (row.delivery_address as string | null) ?? null,
    subtotalCents: Number(row.subtotal_cents ?? 0),
    deliveryFeeCents: Number(row.delivery_fee_cents ?? 0),
    taxCents: Number(row.tax_cents ?? 0),
    totalCents: Number(row.total_cents ?? 0),
    taxExempt: Boolean(row.tax_exempt),
    taxExemptCertificateUrl: (row.tax_exempt_certificate_url as string | null) ?? null,
    paymentProvider: String(row.payment_provider ?? "braintree"),
    paymentTransactionId: (row.payment_transaction_id as string | null) ?? null,
    paymentStatus: row.payment_status as CateringPaymentStatus,
    items: (row.items as CateringOrderItemSnapshot[] | null) ?? [],
    adminNotes: (row.admin_notes as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** List catering orders newest-first, optionally filtered by status. */
export async function listCateringOrders(
  opts: { status?: CateringOrderStatus } = {}
): Promise<CateringOrderRecord[]> {
  let query = getSupabase()
    .from("catering_orders")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  if (opts.status) query = query.eq("status", opts.status);
  const { data, error } = await query;
  if (error) throw new Error(`Catering orders load failed: ${error.message}`);
  return (data ?? []).map((r) => mapCateringOrderRow(r as unknown as Row));
}
