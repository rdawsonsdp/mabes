// mabes/app/components/catering/CateringCartDrawer.test.tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CateringCartProvider, useCateringCart } from "./CateringCartProvider";
import { CateringCartDrawer } from "./CateringCartDrawer";
import { earliestEventDate } from "@/app/lib/catering/config";

function Controls() {
  const { openCart, addItem, setEvent } = useCateringCart();
  return (
    <div>
      <button onClick={openCart}>open</button>
      <button onClick={() => setEvent(earliestEventDate(), "12:00")}>setdate</button>
      <button
        onClick={() =>
          addItem({
            productId: "p-tray", productSlug: "catering-customer-fave-sandwich-tray",
            name: "Customer Fave Sandwich Tray", category: "Trays", image: null,
            quantity: 1, unitPriceCents: 12_500, selectedModifiers: [], notes: null,
          })
        }
      >
        addtray
      </button>
      <button
        onClick={() =>
          addItem({
            productId: "p-lemonade", productSlug: "catering-1-gal-lemonade",
            name: "1 Gal Lemonade", category: "Add-Ons", image: null,
            quantity: 1, unitPriceCents: 1_000, selectedModifiers: [], notes: null,
          })
        }
      >
        addlemonade
      </button>
    </div>
  );
}

function setup() {
  return render(
    <CateringCartProvider>
      <Controls />
      <CateringCartDrawer />
    </CateringCartProvider>
  );
}

describe("CateringCartDrawer", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("shows the empty state until items are added", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText("open"));
    expect(screen.getByText("No items yet")).toBeInTheDocument();
  });

  it("blocks checkout under $60 and shows the minimum message", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText("addlemonade")); // $10 — under min
    await user.click(screen.getByText("setdate"));
    expect(screen.getByRole("alert")).toHaveTextContent("$60.00");
    expect(screen.getByRole("button", { name: "Proceed to checkout" })).toBeDisabled();
  });

  it("enables checkout once over $60 with a valid date", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText("addtray")); // $125 — over min, opens drawer
    await user.click(screen.getByText("setdate"));
    const link = screen.getByRole("link", { name: "Proceed to checkout" });
    expect(link).toHaveAttribute("href", "/catering/checkout");
    expect(screen.getAllByText("$125.00")[0]).toBeInTheDocument();
  });

  it("blocks checkout when over $60 but no valid event date", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByText("addtray"));
    expect(screen.getByRole("alert")).toHaveTextContent(/event date|days' notice/i);
    expect(screen.getByRole("button", { name: "Proceed to checkout" })).toBeDisabled();
  });
});
