// Payment provider abstraction. Braintree is the v1 implementation
// (app/lib/payment/braintree.ts); swapping to Clover/Square/Stripe later means a
// new module implementing this interface, not a checkout rewrite. Money is in
// integer cents at this boundary; provider impls convert to their own format.

export type CreateTransactionInput = {
  /** Amount to charge, in integer cents (e.g. 6000 = $60.00). */
  amountCents: number;
  /** Single-use payment nonce produced by the browser Drop-in UI. */
  paymentNonce: string;
  /** Catering order_number for the provider's order reference, e.g. "MB-1042". */
  orderRef: string;
};

export type TransactionResult = {
  /** Provider transaction id to persist on catering_orders.payment_transaction_id. */
  transactionId: string;
  /** Normalized status mapped onto catering_orders.payment_status. */
  status: "authorized" | "settled" | "failed";
};

export interface PaymentProvider {
  /** Client token for the browser Drop-in UI. */
  createClientToken(): Promise<string>;
  /** Capture a transaction server-side from a client nonce. */
  createTransaction(input: CreateTransactionInput): Promise<TransactionResult>;
}
