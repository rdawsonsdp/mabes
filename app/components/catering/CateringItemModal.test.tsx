import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CateringCartProvider, useCateringCart } from "./CateringCartProvider";
import { CateringItemModal } from "./CateringItemModal";
import type { Product } from "@/app/lib/types";

function CountProbe() {
  const { state } = useCateringCart();
  return <span data-testid="count">{state.itemCount}</span>;
}

const cheeseProduct: Product = {
  id: "p-club", slug: "catering-double-decker-turkey-club", name: "Turkey Club",
  description: "Turkey, turkey bacon, herb mayo.", basePriceCents: 1_450,
  menu: "catering", category: "Boxed Lunches", image: null, isAvailable: true, sortOrder: 0,
  variants: [],
  modifierGroups: [
    {
      id: "g-cheese", name: "Choice of cheese", selectionType: "single", minSelect: 1, maxSelect: 1, sortOrder: 0,
      modifiers: [
        { id: "swiss", name: "Swiss", priceCents: 0, isDefault: true, sortOrder: 0 },
        { id: "cheddar", name: "Cheddar", priceCents: 0, isDefault: false, sortOrder: 1 },
      ],
    },
  ],
};

const trayProduct: Product = {
  id: "p-tray", slug: "catering-customer-fave-sandwich-tray", name: "Customer Fave Sandwich Tray",
  description: "Choice of 2 sandwich types, serves 10.", basePriceCents: 12_500,
  menu: "catering", category: "Trays", image: null, isAvailable: true, sortOrder: 0,
  variants: [],
  modifierGroups: [
    {
      id: "g-pick2", name: "Select 2 types", selectionType: "multiple", minSelect: 2, maxSelect: 2, sortOrder: 0,
      modifiers: [
        { id: "t1", name: "Turkey Club", priceCents: 0, isDefault: false, sortOrder: 0 },
        { id: "t2", name: "Blue Fish", priceCents: 0, isDefault: false, sortOrder: 1 },
        { id: "t3", name: "Veggie", priceCents: 0, isDefault: false, sortOrder: 2 },
      ],
    },
  ],
};

const trayWithDefaultProduct: Product = {
  id: "p-tray-default", slug: "catering-tray-with-default", name: "Tray With Default",
  description: "Choice of 2 sandwich types.", basePriceCents: 12_500,
  menu: "catering", category: "Trays", image: null, isAvailable: true, sortOrder: 0,
  variants: [],
  modifierGroups: [
    {
      id: "g-pick2-default", name: "Select 2 types", selectionType: "multiple", minSelect: 2, maxSelect: 2, sortOrder: 0,
      modifiers: [
        { id: "t1-default", name: "Turkey Club", priceCents: 0, isDefault: true, sortOrder: 0 },
        { id: "t2-default", name: "Blue Fish", priceCents: 0, isDefault: false, sortOrder: 1 },
        { id: "t3-default", name: "Veggie", priceCents: 0, isDefault: false, sortOrder: 2 },
      ],
    },
  ],
};

function renderModal(product: Product) {
  return render(
    <CateringCartProvider>
      <CountProbe />
      <CateringItemModal product={product} onClose={() => {}} />
    </CateringCartProvider>
  );
}

describe("CateringItemModal", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("adds a boxed lunch with the required default cheese, defaulting to the 10-guest minimum", async () => {
    const user = userEvent.setup();
    renderModal(cheeseProduct);
    // Boxed Lunches are per-person with a 10-guest minimum, so qty defaults to 10:
    // 10 × $14.50 = $145.00.
    expect(screen.getByRole("button", { name: /Add to Order/i })).toHaveTextContent("$145.00");
    expect(screen.getByText(/Minimum 10 guests/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Add to Order/i }));
    expect(screen.getByTestId("count").textContent).toBe("10");
  });

  it("blocks adding a tray until exactly 2 types are selected", async () => {
    const user = userEvent.setup();
    renderModal(trayProduct);
    // 0 selected: clicking Add shows the validation error and does not add
    await user.click(screen.getByRole("button", { name: /Add to Order/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/pick 2|exactly 2/i);
    expect(screen.getByTestId("count").textContent).toBe("0");

    // pick 2, then add succeeds
    await user.click(screen.getByLabelText("Turkey Club"));
    await user.click(screen.getByLabelText("Blue Fish"));
    await user.click(screen.getByRole("button", { name: /Add to Order/i }));
    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("enforces the max: a 3rd tray pick is ignored", async () => {
    const user = userEvent.setup();
    renderModal(trayProduct);
    await user.click(screen.getByLabelText("Turkey Club"));
    await user.click(screen.getByLabelText("Blue Fish"));
    await user.click(screen.getByLabelText("Veggie")); // ignored — at max
    expect((screen.getByLabelText("Veggie") as HTMLInputElement).checked).toBe(false);
  });

  it("never preselects a multi-select group even when a modifier has isDefault: true", async () => {
    const user = userEvent.setup();
    renderModal(trayWithDefaultProduct);
    // The first modifier has isDefault: true, but multi-select must not auto-select
    expect((screen.getByLabelText("Turkey Club") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Blue Fish") as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText("Veggie") as HTMLInputElement).checked).toBe(false);
    // Clicking Add with 0 selections should show validation error
    await user.click(screen.getByRole("button", { name: /Add to Order/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/pick 2|exactly 2/i);
    expect(screen.getByTestId("count").textContent).toBe("0");
  });
});
