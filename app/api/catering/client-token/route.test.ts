import { afterEach, describe, expect, it, vi } from "vitest";

const createClientToken = vi.fn();

vi.mock("@/app/lib/payment/braintree", () => ({
  braintreePayment: { createClientToken },
}));

afterEach(() => {
  createClientToken.mockReset();
  vi.restoreAllMocks();
});

describe("GET /api/catering/client-token", () => {
  it("returns 200 with the client token", async () => {
    createClientToken.mockResolvedValue("tok_live_xyz");
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ clientToken: "tok_live_xyz" });
  });

  it("returns 500 with a generic error when token generation throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    createClientToken.mockRejectedValue(new Error("braintree down"));
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: "Unable to start payment. Please try again.",
    });
  });
});
