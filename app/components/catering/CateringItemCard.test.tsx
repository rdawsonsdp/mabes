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
  it("renders name and per-person price with the guest minimum", () => {
    render(<CateringItemCard product={product()} onSelect={() => {}} />);
    expect(screen.getByText("The Blue Fish Sandwich Box")).toBeInTheDocument();
    // Boxed Lunches are per-person with a 10-guest minimum
    expect(screen.getByText("$12.00 / person")).toBeInTheDocument();
    expect(screen.getByText(/Min 10 guests/i)).toBeInTheDocument();
  });

  it("shows a flat price (no '/ person', no guest min) for non-per-person categories", () => {
    render(<CateringItemCard product={product({ category: "Add-Ons", name: "1 Dozen Cookies" })} onSelect={() => {}} />);
    expect(screen.getByText("$12.00")).toBeInTheDocument();
    expect(screen.queryByText(/Min 10 guests/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/ person/i)).not.toBeInTheDocument();
  });

  it("opens the item detail (calls onSelect) when the card is tapped", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const p = product();
    render(<CateringItemCard product={p} onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: /Add The Blue Fish/i }));
    expect(onSelect).toHaveBeenCalledWith(p);
  });
});
