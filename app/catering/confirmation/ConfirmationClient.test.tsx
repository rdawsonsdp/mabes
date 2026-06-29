import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { CateringOrderRecord } from "@/app/lib/catering/types";

const downloadCateringOrderPdf = vi.hoisted(() => vi.fn());
vi.mock("@/app/lib/catering/pdf", () => ({ downloadCateringOrderPdf }));

function record(over: Partial<CateringOrderRecord> = {}): CateringOrderRecord {
  return {
    id: "uuid-1",
    orderNumber: "MB-1042",
    status: "quote_requested",
    isQuote: true,
    customerName: "Connie Brown",
    customerEmail: "connie@example.com",
    customerPhone: "(773) 555-0000",
    company: null,
    eventDate: "2026-07-10",
    eventTime: "12:00 PM",
    headcount: 20,
    specialInstructions: null,
    fulfillmentType: "pickup",
    deliveryAddress: null,
    subtotalCents: 7200,
    deliveryFeeCents: 0,
    taxCents: 738,
    totalCents: 7938,
    taxExempt: false,
    taxExemptCertificateUrl: null,
    paymentProvider: "braintree",
    paymentTransactionId: null,
    paymentStatus: "none",
    items: [
      { productId: "p1", name: "The Blue Fish Sandwich Box", quantity: 6, unitPriceCents: 1200, lineTotalCents: 7200, selectedModifiers: [], notes: null },
    ],
    adminNotes: null,
    createdAt: "2026-06-29T00:00:00Z",
    updatedAt: "2026-06-29T00:00:00Z",
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

import { ConfirmationClient } from "./ConfirmationClient";

describe("ConfirmationClient", () => {
  it("shows an empty state when there is no stored order", () => {
    render(<ConfirmationClient />);
    expect(screen.getByText(/no recent catering order/i)).toBeInTheDocument();
  });

  it("renders the order number, total, and quote copy", () => {
    sessionStorage.setItem("mabes-last-catering-order", JSON.stringify(record()));
    render(<ConfirmationClient />);
    expect(screen.getByText(/MB-1042/)).toBeInTheDocument();
    expect(screen.getByText("$79.38")).toBeInTheDocument();
    expect(screen.getAllByText(/quote/i).length).toBeGreaterThan(0);
  });

  it("downloads the PDF when the button is clicked", () => {
    sessionStorage.setItem("mabes-last-catering-order", JSON.stringify(record()));
    render(<ConfirmationClient />);
    fireEvent.click(screen.getByRole("button", { name: /download pdf/i }));
    expect(downloadCateringOrderPdf).toHaveBeenCalledTimes(1);
    expect(downloadCateringOrderPdf.mock.calls[0][0].orderNumber).toBe("MB-1042");
  });
});
