import type { Product } from "@/app/lib/types";

// ---- Catalog (reuse) ----
// A catering catalog item IS a Product with menu === "catering".
export type CateringProduct = Product;
export type CateringMenuItem = Product; // alias used by store UI

// ---- Selected modifiers (client-side cart) ----
// Mirrors app/lib/types CartItemModifier, but the catering cart never hits the
// server cart so we snapshot name + price at add time, client-side.
export type SelectedModifier = {
  modifierId: string;
  groupId: string;
  name: string;
  priceCents: number;
};

// ---- Catering cart item ----
export type CateringCartItem = {
  /** stable client id (crypto.randomUUID) — there is no DB row until submit */
  lineId: string;
  productId: string;
  productSlug: string;
  name: string; // snapshot of product name
  category: string; // "Boxed Lunches" | "Wraps" | "Trays" | "Add-Ons"
  image: string | null;
  quantity: number;
  unitPriceCents: number; // base + sum(selectedModifiers.priceCents)
  lineTotalCents: number; // unitPriceCents * quantity
  selectedModifiers: SelectedModifier[];
  notes: string | null;
};

// ---- Fulfillment ----
export type FulfillmentType = "pickup" | "delivery";

// ---- Cart state ----
export type CateringCartState = {
  items: CateringCartItem[];
  fulfillmentType: FulfillmentType;
  /** ISO date (yyyy-mm-dd); must satisfy 2-day lead time */
  eventDate: string | null;
  /** free-text or HH:mm */
  eventTime: string | null;
  subtotalCents: number; // sum of lineTotalCents
  itemCount: number; // sum of quantities
};

export const EMPTY_CATERING_CART: CateringCartState = {
  items: [],
  fulfillmentType: "pickup",
  eventDate: null,
  eventTime: null,
  subtotalCents: 0,
  itemCount: 0,
};

// ---- Reducer action union ----
export type CateringCartAction =
  | { type: "ADD_ITEM"; item: Omit<CateringCartItem, "lineId" | "lineTotalCents"> }
  | { type: "UPDATE_QTY"; lineId: string; quantity: number }
  | { type: "REMOVE_ITEM"; lineId: string }
  | { type: "SET_FULFILLMENT"; fulfillmentType: FulfillmentType }
  | { type: "SET_EVENT"; eventDate: string | null; eventTime: string | null }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; state: CateringCartState };

// ---- Money breakdown (derived at checkout; see config.ts) ----
export type CateringTotals = {
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
};

// ---- Order submit payload (client → POST /api/catering/checkout) ----
export type CateringOrderInput = {
  isQuote: boolean;
  fulfillmentType: FulfillmentType;
  customer: {
    name: string;
    email: string;
    phone: string;
    company: string | null;
  };
  event: {
    date: string; // yyyy-mm-dd (lead-time validated server-side too)
    time: string | null;
    headcount: number | null;
    specialInstructions: string | null;
  };
  deliveryAddress: string | null; // required when fulfillmentType==="delivery"
  taxExempt: boolean;
  taxExemptCertificateUrl: string | null;
  items: CateringCartItem[]; // client snapshot; server re-prices
  /** Braintree payment nonce — present only when isQuote === false */
  paymentNonce: string | null;
};

// ---- Persisted order record (DB row → app) ----
export type CateringOrderStatus =
  | "quote_requested"
  | "pending_payment"
  | "paid"
  | "confirmed"
  | "cancelled";

export type CateringPaymentStatus = "none" | "authorized" | "settled" | "failed";

export type CateringOrderItemSnapshot = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  selectedModifiers: { name: string; priceCents: number }[];
  notes: string | null;
};

export type CateringOrderRecord = {
  id: string;
  orderNumber: string; // "MB-1042"
  status: CateringOrderStatus;
  isQuote: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  company: string | null;
  eventDate: string | null;
  eventTime: string | null;
  headcount: number | null;
  specialInstructions: string | null;
  fulfillmentType: FulfillmentType;
  deliveryAddress: string | null;
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
  taxExempt: boolean;
  taxExemptCertificateUrl: string | null;
  paymentProvider: string; // "braintree"
  paymentTransactionId: string | null;
  paymentStatus: CateringPaymentStatus;
  items: CateringOrderItemSnapshot[];
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};
