import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CateringCartState } from "@/app/lib/catering/types";

// Mock the Drop-in so requestNonce() resolves a known nonce.
vi.mock("@/app/components/catering/BraintreeDropIn", async () => {
  const { forwardRef, useImperativeHandle } = await import("react");
  return {
    BraintreeDropIn: forwardRef((_props: any, ref: any) => {
      useImperativeHandle(ref, () => ({
        requestNonce: () => Promise.resolve("fake-nonce-123"),
      }));
      return null;
    }),
  };
});

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

// Two-item cart so no single line total equals the subtotal.
// Item A: qty 1 @ $12.00 (lineTotal $12.00)
// Item B: qty 1 @ $60.00 (lineTotal $60.00)
// subtotal: $72.00
const cart: CateringCartState = {
  items: [
    {
      lineId: "l1",
      productId: "p1",
      productSlug: "catering-fish-sandwich-box",
      name: "Fish Sandwich Box",
      category: "Boxed Lunches",
      image: null,
      quantity: 1,
      unitPriceCents: 1200,
      lineTotalCents: 1200,
      selectedModifiers: [],
      notes: null,
    },
    {
      lineId: "l2",
      productId: "p2",
      productSlug: "catering-party-platter",
      name: "Party Platter",
      category: "Platters",
      image: null,
      quantity: 1,
      unitPriceCents: 6000,
      lineTotalCents: 6000,
      selectedModifiers: [],
      notes: null,
    },
  ],
  fulfillmentType: "pickup",
  eventDate: null,
  eventTime: null,
  subtotalCents: 7200,
  itemCount: 2,
};
const clear = vi.fn();
vi.mock("@/app/components/catering/CateringCartProvider", () => ({
  CateringCartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useCateringCart: () => ({ state: cart, clear }),
}));

const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = fetchMock as unknown as typeof fetch;
  Storage.prototype.setItem = vi.fn();
});

import { CheckoutClient } from "./CheckoutClient";

describe("CheckoutClient", () => {
  it("renders cart item names, per-item line totals, subtotal, and step 1 (Details)", () => {
    render(<CheckoutClient />);
    expect(screen.getByText("Fish Sandwich Box")).toBeInTheDocument();
    expect(screen.getByText("Party Platter")).toBeInTheDocument();
    // Per-item line totals (different from each other and from subtotal)
    expect(screen.getByText("$12.00")).toBeInTheDocument();
    expect(screen.getByText("$60.00")).toBeInTheDocument();
    // Subtotal row — $72.00 appears only here (neither line total equals the subtotal)
    expect(screen.getByText("$72.00")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /contact/i })).toBeInTheDocument();
  });

  it("blocks advancing to Confirm until required fields are valid", () => {
    render(<CheckoutClient />);
    fireEvent.click(screen.getByRole("button", { name: /review order/i }));
    expect(screen.getByText(/please complete/i)).toBeInTheDocument();
  });

  it("submits a quote and navigates to confirmation on success", async () => {
    const orderRecord = { orderNumber: "MB-1042", isQuote: true, totalCents: 7938 };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, order: orderRecord }),
    });

    render(<CheckoutClient />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Connie Brown" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "c@example.com" } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "773-555-0000" } });
    fireEvent.change(screen.getByLabelText(/event date/i), { target: { value: "2030-01-10" } });
    fireEvent.click(screen.getByRole("button", { name: /review order/i }));

    // Step 2 → submit the quote
    fireEvent.click(await screen.findByRole("button", { name: /request a quote/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/catering/checkout",
      expect.objectContaining({ method: "POST" })
    ));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.isQuote).toBe(true);
    expect(body.paymentNonce).toBeNull();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/catering/confirmation"));
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      "mabes-last-catering-order",
      JSON.stringify(orderRecord)
    );
  });

  it("Place Order & Pay posts the Braintree nonce", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ order: { id: "x", orderNumber: "MB-1001" } }) });
    vi.stubGlobal("fetch", fetchMock);

    render(<CheckoutClient />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Connie Brown" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "c@example.com" } });
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "773-555-0000" } });
    fireEvent.change(screen.getByLabelText(/event date/i), { target: { value: "2030-01-10" } });
    fireEvent.click(screen.getByRole("button", { name: /review order/i }));

    fireEvent.click(await screen.findByRole("button", { name: /place order & pay/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.isQuote).toBe(false);
    expect(body.paymentNonce).toBe("fake-nonce-123");
  });
});
