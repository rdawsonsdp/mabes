import braintree from "braintree";
import type {
  CreateTransactionInput,
  PaymentProvider,
  TransactionResult,
} from "./provider";

/** Cents → Braintree decimal amount string. 6000 → "60.00". */
export function centsToAmountString(cents: number): string {
  return (Math.round(cents) / 100).toFixed(2);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

let cachedGateway: braintree.BraintreeGateway | null = null;

/** Cached Braintree gateway built from env. Throws on missing credentials. */
export function getGateway(): braintree.BraintreeGateway {
  if (cachedGateway) return cachedGateway;
  const env = (process.env.BRAINTREE_ENVIRONMENT ?? "sandbox").trim();
  const environment =
    env === "production"
      ? braintree.Environment.Production
      : braintree.Environment.Sandbox;
  cachedGateway = new braintree.BraintreeGateway({
    environment,
    merchantId: requireEnv("BRAINTREE_MERCHANT_ID"),
    publicKey: requireEnv("BRAINTREE_PUBLIC_KEY"),
    privateKey: requireEnv("BRAINTREE_PRIVATE_KEY"),
  });
  return cachedGateway;
}

/** Map a Braintree transaction status onto our normalized TransactionResult status. */
function mapTransactionStatus(btStatus: string): TransactionResult["status"] {
  switch (btStatus) {
    case "settled":
    case "settling":
      return "settled";
    case "authorized":
    case "submitted_for_settlement":
      return "authorized";
    default:
      // processor_declined, gateway_rejected, failed, voided, etc.
      return "failed";
  }
}

export const braintreePayment: PaymentProvider = {
  async createClientToken(): Promise<string> {
    const gateway = getGateway();
    const response = await gateway.clientToken.generate({});
    if (!response.success || !response.clientToken) {
      throw new Error("Braintree client token generation failed");
    }
    return response.clientToken;
  },

  async createTransaction(
    input: CreateTransactionInput
  ): Promise<TransactionResult> {
    const gateway = getGateway();
    const result = await gateway.transaction.sale({
      amount: centsToAmountString(input.amountCents),
      paymentMethodNonce: input.paymentNonce,
      orderId: input.orderRef,
      options: { submitForSettlement: true },
    });

    if (!result.success || !result.transaction) {
      // Declined / rejected: surface a failed result rather than throwing, so the
      // submit route can record payment_status='failed' and return a clean error.
      return {
        transactionId: result.transaction?.id ?? "",
        status: "failed",
      };
    }

    return {
      transactionId: result.transaction.id,
      status: mapTransactionStatus(result.transaction.status),
    };
  },
};
