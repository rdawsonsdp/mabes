import { afterEach, describe, expect, it, vi } from "vitest";
import { chargeCateringOrder } from "./run-payment";
import type { PaymentProvider } from "./provider";

function fakeProvider(over: Partial<PaymentProvider>): PaymentProvider {
  return {
    createClientToken: vi.fn().mockResolvedValue("tok"),
    createTransaction: vi.fn(),
    ...over,
  };
}

afterEach(() => vi.restoreAllMocks());

describe("chargeCateringOrder", () => {
  it("returns paid + settled fields on a settled transaction", async () => {
    const provider = fakeProvider({
      createTransaction: vi
        .fn()
        .mockResolvedValue({ transactionId: "txn_1", status: "settled" }),
    });
    const out = await chargeCateringOrder({
      amountCents: 6000,
      paymentNonce: "n",
      orderRef: "MB-1042",
      provider,
    });
    expect(provider.createTransaction).toHaveBeenCalledWith({
      amountCents: 6000,
      paymentNonce: "n",
      orderRef: "MB-1042",
    });
    expect(out).toEqual({
      ok: true,
      paymentProvider: "braintree",
      paymentTransactionId: "txn_1",
      paymentStatus: "settled",
      orderStatus: "paid",
    });
  });

  it("returns paid + authorized fields on an authorized transaction", async () => {
    const provider = fakeProvider({
      createTransaction: vi
        .fn()
        .mockResolvedValue({ transactionId: "txn_2", status: "authorized" }),
    });
    const out = await chargeCateringOrder({
      amountCents: 10000,
      paymentNonce: "n",
      orderRef: "MB-2",
      provider,
    });
    expect(out.ok).toBe(true);
    expect(out.orderStatus).toBe("paid");
    expect(out.paymentStatus).toBe("authorized");
    expect(out.paymentTransactionId).toBe("txn_2");
  });

  it("returns ok:false with a decline message on a failed transaction", async () => {
    const provider = fakeProvider({
      createTransaction: vi
        .fn()
        .mockResolvedValue({ transactionId: "txn_3", status: "failed" }),
    });
    const out = await chargeCateringOrder({
      amountCents: 6000,
      paymentNonce: "bad",
      orderRef: "MB-3",
      provider,
    });
    expect(out.ok).toBe(false);
    expect(out.orderStatus).toBe("pending_payment");
    expect(out.paymentStatus).toBe("failed");
    expect(out.paymentTransactionId).toBe("txn_3");
    expect(out.error).toMatch(/declined/i);
  });

  it("returns ok:false with a generic message when the provider throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const provider = fakeProvider({
      createTransaction: vi.fn().mockRejectedValue(new Error("network")),
    });
    const out = await chargeCateringOrder({
      amountCents: 6000,
      paymentNonce: "n",
      orderRef: "MB-4",
      provider,
    });
    expect(out.ok).toBe(false);
    expect(out.paymentTransactionId).toBeNull();
    expect(out.paymentStatus).toBe("failed");
    expect(out.error).toMatch(/could not be processed/i);
  });
});
