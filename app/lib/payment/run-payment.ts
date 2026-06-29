import { braintreePayment } from "./braintree";
import type { PaymentProvider } from "./provider";
import type {
  CateringOrderStatus,
  CateringPaymentStatus,
} from "@/app/lib/catering/types";

export type ChargeFields = {
  ok: boolean;
  paymentProvider: string;
  paymentTransactionId: string | null;
  paymentStatus: CateringPaymentStatus;
  orderStatus: CateringOrderStatus;
  error?: string;
};

export const PAYMENT_PROVIDER_NAME = "braintree";

/**
 * Capture a catering payment and return the exact fields the checkout route
 * persists onto catering_orders. Never throws on a declined card — returns
 * ok:false with a user-facing message so the route can respond cleanly.
 */
export async function chargeCateringOrder(args: {
  amountCents: number;
  paymentNonce: string;
  orderRef: string;
  provider?: PaymentProvider;
}): Promise<ChargeFields> {
  const provider = args.provider ?? braintreePayment;

  let result;
  try {
    result = await provider.createTransaction({
      amountCents: args.amountCents,
      paymentNonce: args.paymentNonce,
      orderRef: args.orderRef,
    });
  } catch (error) {
    console.error("[catering] payment error:", error);
    return {
      ok: false,
      paymentProvider: PAYMENT_PROVIDER_NAME,
      paymentTransactionId: null,
      paymentStatus: "failed",
      orderStatus: "pending_payment",
      error: "Payment could not be processed. Please try again.",
    };
  }

  if (result.status === "failed") {
    return {
      ok: false,
      paymentProvider: PAYMENT_PROVIDER_NAME,
      paymentTransactionId: result.transactionId || null,
      paymentStatus: "failed",
      orderStatus: "pending_payment",
      error: "Your payment was declined. Please try a different card.",
    };
  }

  // result.status is "authorized" or "settled" → payment captured. The order
  // becomes "paid"; payment_status preserves the settlement detail.
  return {
    ok: true,
    paymentProvider: PAYMENT_PROVIDER_NAME,
    paymentTransactionId: result.transactionId,
    paymentStatus: result.status, // "authorized" | "settled"
    orderStatus: "paid",
  };
}
