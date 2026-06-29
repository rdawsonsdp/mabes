import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Shared spies the mocked gateway will expose.
const generate = vi.fn();
const sale = vi.fn();

vi.mock("braintree", () => ({
  default: {
    Environment: { Sandbox: "sandbox", Production: "production" },
    BraintreeGateway: class {
      clientToken = { generate };
      transaction = { sale };
    },
  },
}));

const ENV = {
  BRAINTREE_ENVIRONMENT: "sandbox",
  BRAINTREE_MERCHANT_ID: "merch_test",
  BRAINTREE_PUBLIC_KEY: "pub_test",
  BRAINTREE_PRIVATE_KEY: "priv_test",
};

beforeEach(() => {
  vi.resetModules(); // reset the cached gateway between tests
  generate.mockReset();
  sale.mockReset();
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v;
});

afterEach(() => {
  for (const k of Object.keys(ENV)) delete process.env[k];
});

describe("centsToAmountString", () => {
  it("formats cents as a 2-decimal dollar string", async () => {
    const { centsToAmountString } = await import("./braintree");
    expect(centsToAmountString(6000)).toBe("60.00");
    expect(centsToAmountString(12345)).toBe("123.45");
    expect(centsToAmountString(5)).toBe("0.05");
    expect(centsToAmountString(0)).toBe("0.00");
  });
});

describe("getGateway", () => {
  it("throws a named error when a credential env var is missing", async () => {
    delete process.env.BRAINTREE_PRIVATE_KEY;
    const { getGateway } = await import("./braintree");
    expect(() => getGateway()).toThrowError(
      "Missing required env var: BRAINTREE_PRIVATE_KEY"
    );
  });
});

describe("braintreePayment.createClientToken", () => {
  it("returns the client token on success", async () => {
    generate.mockResolvedValue({ success: true, clientToken: "tok_abc123" });
    const { braintreePayment } = await import("./braintree");
    await expect(braintreePayment.createClientToken()).resolves.toBe("tok_abc123");
    expect(generate).toHaveBeenCalledWith({});
  });

  it("throws when Braintree reports failure", async () => {
    generate.mockResolvedValue({ success: false });
    const { braintreePayment } = await import("./braintree");
    await expect(braintreePayment.createClientToken()).rejects.toThrow(
      "Braintree client token generation failed"
    );
  });
});

describe("braintreePayment.createTransaction", () => {
  it("sends the amount as a dollar string and submits for settlement", async () => {
    sale.mockResolvedValue({
      success: true,
      transaction: { id: "txn_1", status: "submitted_for_settlement" },
    });
    const { braintreePayment } = await import("./braintree");
    const result = await braintreePayment.createTransaction({
      amountCents: 6000,
      paymentNonce: "fake-valid-nonce",
      orderRef: "MB-1042",
    });
    expect(sale).toHaveBeenCalledWith({
      amount: "60.00",
      paymentMethodNonce: "fake-valid-nonce",
      orderId: "MB-1042",
      options: { submitForSettlement: true },
    });
    expect(result).toEqual({ transactionId: "txn_1", status: "authorized" });
  });

  it("maps a settled transaction to status 'settled'", async () => {
    sale.mockResolvedValue({
      success: true,
      transaction: { id: "txn_2", status: "settled" },
    });
    const { braintreePayment } = await import("./braintree");
    const result = await braintreePayment.createTransaction({
      amountCents: 10000,
      paymentNonce: "n",
      orderRef: "MB-2",
    });
    expect(result).toEqual({ transactionId: "txn_2", status: "settled" });
  });

  it("returns status 'failed' (without throwing) on a declined sale", async () => {
    sale.mockResolvedValue({
      success: false,
      transaction: { id: "txn_3", status: "processor_declined" },
      message: "Do Not Honor",
    });
    const { braintreePayment } = await import("./braintree");
    const result = await braintreePayment.createTransaction({
      amountCents: 6000,
      paymentNonce: "fake-processor-declined-nonce",
      orderRef: "MB-3",
    });
    expect(result).toEqual({ transactionId: "txn_3", status: "failed" });
  });

  it("returns an empty transactionId when Braintree returns no transaction", async () => {
    sale.mockResolvedValue({ success: false, message: "Gateway rejected" });
    const { braintreePayment } = await import("./braintree");
    const result = await braintreePayment.createTransaction({
      amountCents: 6000,
      paymentNonce: "bad",
      orderRef: "MB-4",
    });
    expect(result).toEqual({ transactionId: "", status: "failed" });
  });
});
