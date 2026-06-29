import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BraintreeDropIn, type BraintreeDropInHandle } from "./BraintreeDropIn";

// vi.mock is hoisted; declare the spy via vi.hoisted so it's available in the factory.
const { create } = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("braintree-web-drop-in", () => ({
  default: { create },
}));

const requestPaymentMethod = vi.fn();
const teardown = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  create.mockReset();
  requestPaymentMethod.mockReset();
  teardown.mockClear();
  create.mockResolvedValue({ requestPaymentMethod, teardown });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ clientToken: "tok_test" }),
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("BraintreeDropIn", () => {
  it("fetches a client token, mounts the Drop-in, and fires onReady", async () => {
    const onReady = vi.fn();
    render(<BraintreeDropIn onReady={onReady} />);
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith("/api/catering/client-token");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ authorization: "tok_test" })
    );
  });

  it("requestNonce() resolves the nonce from the Drop-in instance", async () => {
    requestPaymentMethod.mockResolvedValue({ nonce: "fake-valid-nonce" });
    const ref = createRef<BraintreeDropInHandle>();
    const onReady = vi.fn();
    render(<BraintreeDropIn ref={ref} onReady={onReady} />);
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    await expect(ref.current!.requestNonce()).resolves.toBe("fake-valid-nonce");
  });

  it("shows an error and fires onError when token fetch fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
    });
    const onError = vi.fn();
    render(<BraintreeDropIn onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(
      screen.getByText(/Could not load the payment form/i)
    ).toBeInTheDocument();
  });
});
