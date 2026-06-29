import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CateringItemCard } from "./CateringItemCard";
import type { Product } from "@/app/lib/types";

function product(over: Partial<Product> = {}): Product {
  return {
    id: "p1",
    slug: "catering-the-blue-fish-box",
    name: "The Blue Fish Sandwich Box",
    description: "Tuna Salad w/ Pepper Jack on Texas Toast. Served with chips.",
    basePriceCents: 1_200,
    menu: "catering",
    category: "Boxed Lunches",
    image: null,
    isAvailable: true,
    sortOrder: 0,
    variants: [],
    modifierGroups: [],
    ...over,
  };
}

describe("CateringItemCard", () => {
  it("renders name, description, and per-person price with the guest minimum", () => {
    render(<CateringItemCard product={product()} onSelect={() => {}} />);
    expect(screen.getByText("The Blue Fish Sandwich Box")).toBeInTheDocument();
    expect(screen.getByText(/Tuna Salad/)).toBeInTheDocument();
    // Boxed Lunches are per-person with a 10-guest minimum
    expect(screen.getByText("$12.00 / person")).toBeInTheDocument();
    expect(screen.getByText(/Minimum 10 guests/i)).toBeInTheDocument();
  });

  it("shows a flat price (no '/ person') for non-per-person categories like Add-Ons", () => {
    render(<CateringItemCard product={product({ category: "Add-Ons", name: "1 Dozen Cookies" })} onSelect={() => {}} />);
    expect(screen.getByText("$12.00")).toBeInTheDocument();
    expect(screen.queryByText(/Minimum 10 guests/i)).not.toBeInTheDocument();
  });

  it("shows 'Options available' and 'Choose options' when the product has modifier groups", () => {
    const p = product({
      modifierGroups: [
        { id: "g-cheese", name: "Choice of cheese", selectionType: "single", minSelect: 1, maxSelect: 1, sortOrder: 0, modifiers: [] },
      ],
    });
    render(<CateringItemCard product={p} onSelect={() => {}} />);
    expect(screen.getByText("Options available")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add The Blue Fish/i })).toHaveTextContent("Choose options");
  });

  it("calls onSelect with the product when the button is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const p = product();
    render(<CateringItemCard product={p} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: /Add The Blue Fish/i }));
    expect(onSelect).toHaveBeenCalledWith(p);
  });
});
