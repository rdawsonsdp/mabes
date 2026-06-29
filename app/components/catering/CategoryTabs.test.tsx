import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryTabs } from "./CategoryTabs";

const CATS = ["Boxed Lunches", "Wraps", "Trays", "Add-Ons"];

describe("CategoryTabs", () => {
  it("renders all categories and marks the active one", () => {
    render(<CategoryTabs categories={CATS} active="Wraps" onSelect={() => {}} />);
    CATS.forEach((c) => expect(screen.getByRole("button", { name: c })).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Wraps" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Trays" })).not.toHaveAttribute("aria-current");
  });

  it("calls onSelect with the clicked category", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CategoryTabs categories={CATS} active="Boxed Lunches" onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Trays" }));
    expect(onSelect).toHaveBeenCalledWith("Trays");
  });
});
