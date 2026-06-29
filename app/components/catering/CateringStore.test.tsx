import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CateringCartProvider } from "./CateringCartProvider";
import { CateringStore } from "./CateringStore";
import type { MenuGroup, Product } from "@/app/lib/types";

function p(id: string, name: string, category: string, modifierGroups: Product["modifierGroups"] = []): Product {
  return {
    id, slug: id, name, description: null, basePriceCents: 1_200, menu: "catering",
    category, image: null, isAvailable: true, sortOrder: 0, variants: [], modifierGroups,
  };
}

const menus: MenuGroup[] = [
  {
    menu: "catering",
    categories: [
      { category: "Boxed Lunches", products: [p("p1", "Blue Fish Box", "Boxed Lunches")] },
      { category: "Trays", products: [p("p2", "Sandwich Tray", "Trays")] },
    ],
  },
];

function setup() {
  return render(
    <CateringCartProvider>
      <CateringStore menus={menus} />
    </CateringCartProvider>
  );
}

describe("CateringStore", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("shows the first category's products by default", () => {
    setup();
    expect(screen.getByText("Blue Fish Box")).toBeInTheDocument();
    expect(screen.queryByText("Sandwich Tray")).not.toBeInTheDocument();
  });

  it("switches categories via the tabs", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Trays" }));
    expect(screen.getByText("Sandwich Tray")).toBeInTheDocument();
    expect(screen.queryByText("Blue Fish Box")).not.toBeInTheDocument();
  });

  it("opens the item modal and surfaces the floating view-order button after adding", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: /Add Blue Fish Box/i }));
    // modal open
    expect(screen.getByRole("dialog", { name: /Customize Blue Fish Box/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Add to Order/i }));
    // Boxed Lunches default to the 10-guest minimum, so the cart reflects 10 items
    expect(screen.getByRole("button", { name: /View order/i })).toHaveTextContent("10 items");
  });
});
