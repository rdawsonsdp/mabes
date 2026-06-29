import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { CateringCartState } from "@/app/lib/catering/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

// Provide a populated cart via the mocked hook.
const cart: CateringCartState = {
  items: [
    {
      lineId: "l1",
      productId: "p1",
      productSlug: "catering-the-blue-fish-box",
      name: "The Blue Fish Sandwich Box",
      category: "Boxed Lunches",
      image: null,
      quantity: 6,
      unitPriceCents: 1200,
      lineTotalCents: 7200,
      selectedModifiers: [],
      notes: null,
    },
  ],
  fulfillmentType: "pickup",
  eventDate: null,
  eventTime: null,
  subtotalCents: 7200,
  itemCount: 6,
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
  it("renders the cart subtotal and step 1 (Details)", () => {
    render(<CheckoutClient />);
    expect(screen.getByText("The Blue Fish Sandwich Box")).toBeInTheDocument();
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
    await waitFor(() => expect(push).toHaveBeenCalledWith("/catering/confirmation"));
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      "mabes-last-catering-order",
      JSON.stringify(orderRecord)
    );
  });
});
