import { describe, expect, it } from "vitest";

// Real sandbox integration. Skipped unless BRAINTREE_SMOKE is set AND the four
// BRAINTREE_* env vars are present (loaded from .env.local before running).
// Run with: npm run test:smoke
const enabled =
  process.env.BRAINTREE_SMOKE === "1" &&
  Boolean(process.env.BRAINTREE_MERCHANT_ID) &&
  Boolean(process.env.BRAINTREE_PUBLIC_KEY) &&
  Boolean(process.env.BRAINTREE_PRIVATE_KEY);

describe.skipIf(!enabled)("Braintree sandbox smoke", () => {
  it("generates a real client token", async () => {
    const { braintreePayment } = await import("./braintree");
    const token = await braintreePayment.createClientToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
  });

  it("captures a real sandbox transaction with the fake-valid-nonce", async () => {
    const { braintreePayment } = await import("./braintree");
    const result = await braintreePayment.createTransaction({
      amountCents: 6000,
      paymentNonce: "fake-valid-nonce",
      orderRef: `MB-SMOKE-${Date.now()}`,
    });
    expect(result.transactionId).toMatch(/.+/);
    expect(["authorized", "settled"]).toContain(result.status);
  });
});
