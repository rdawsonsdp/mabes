import { getSupabase } from "@/app/lib/supabase/server";
import type {
  CateringOrderRecord,
  CateringOrderStatus,
  CateringOrderItemSnapshot,
} from "./types";

export type InsertCateringOrderInput = Omit<
  CateringOrderRecord,
  "id" | "createdAt" | "updatedAt"
>;

const ROW_SELECT = `
  id, order_number, status, is_quote,
  customer_name, customer_email, customer_phone, company,
  event_date, event_time, headcount, special_instructions,
  fulfillment_type, delivery_address,
  subtotal_cents, delivery_fee_cents, tax_cents, total_cents,
  tax_exempt, tax_exempt_certificate_url,
  payment_provider, payment_transaction_id, payment_status,
  items, admin_notes, created_at, updated_at
`;

type Row = Record<string, unknown>;

function mapRow(r: Row): CateringOrderRecord {
  return {
    id: String(r.id),
    orderNumber: String(r.order_number),
    status: r.status as CateringOrderStatus,
    isQuote: Boolean(r.is_quote),
    customerName: String(r.customer_name),
    customerEmail: String(r.customer_email),
    customerPhone: (r.customer_phone as string) ?? null,
    company: (r.company as string) ?? null,
    eventDate: (r.event_date as string) ?? null,
    eventTime: (r.event_time as string) ?? null,
    headcount: r.headcount == null ? null : Number(r.headcount),
    specialInstructions: (r.special_instructions as string) ?? null,
    fulfillmentType: r.fulfillment_type as CateringOrderRecord["fulfillmentType"],
    deliveryAddress: (r.delivery_address as string) ?? null,
    subtotalCents: Number(r.subtotal_cents),
    deliveryFeeCents: Number(r.delivery_fee_cents),
    taxCents: Number(r.tax_cents),
    totalCents: Number(r.total_cents),
    taxExempt: Boolean(r.tax_exempt),
    taxExemptCertificateUrl: (r.tax_exempt_certificate_url as string) ?? null,
    paymentProvider: String(r.payment_provider),
    paymentTransactionId: (r.payment_transaction_id as string) ?? null,
    paymentStatus: r.payment_status as CateringOrderRecord["paymentStatus"],
    items: (r.items as CateringOrderItemSnapshot[]) ?? [],
    adminNotes: (r.admin_notes as string) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function insertCateringOrder(
  input: InsertCateringOrderInput
): Promise<CateringOrderRecord> {
  const { data, error } = await getSupabase()
    .from("catering_orders")
    .insert({
      order_number: input.orderNumber,
      status: input.status,
      is_quote: input.isQuote,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      company: input.company,
      event_date: input.eventDate,
      event_time: input.eventTime,
      headcount: input.headcount,
      special_instructions: input.specialInstructions,
      fulfillment_type: input.fulfillmentType,
      delivery_address: input.deliveryAddress,
      subtotal_cents: input.subtotalCents,
      delivery_fee_cents: input.deliveryFeeCents,
      tax_cents: input.taxCents,
      total_cents: input.totalCents,
      tax_exempt: input.taxExempt,
      tax_exempt_certificate_url: input.taxExemptCertificateUrl,
      payment_provider: input.paymentProvider,
      payment_transaction_id: input.paymentTransactionId,
      payment_status: input.paymentStatus,
      items: input.items,
      admin_notes: input.adminNotes,
    })
    .select(ROW_SELECT)
    .single();
  if (error || !data) {
    throw new Error(`Failed to save catering order: ${error?.message ?? "no row returned"}`);
  }
  return mapRow(data as Row);
}

export async function getCateringOrder(id: string): Promise<CateringOrderRecord | null> {
  const { data, error } = await getSupabase()
    .from("catering_orders")
    .select(ROW_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load catering order: ${error.message}`);
  return data ? mapRow(data as Row) : null;
}

export async function getCateringOrderByNumber(
  orderNumber: string
): Promise<CateringOrderRecord | null> {
  const { data, error } = await getSupabase()
    .from("catering_orders")
    .select(ROW_SELECT)
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) throw new Error(`Failed to load catering order: ${error.message}`);
  return data ? mapRow(data as Row) : null;
}

export async function updateCateringOrderStatus(
  id: string,
  status: CateringOrderStatus
): Promise<CateringOrderRecord> {
  const { data, error } = await getSupabase()
    .from("catering_orders")
    .update({ status })
    .eq("id", id)
    .select(ROW_SELECT)
    .single();
  if (error || !data) {
    throw new Error(`Failed to update catering order: ${error?.message ?? "no row returned"}`);
  }
  return mapRow(data as Row);
}
