import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminMenuEditor } from "./AdminMenuEditor";
import type { Product } from "@/app/lib/types";

function item(over: Partial<Product>): Product {
  return {
    id: "x",
    slug: "catering-x",
    name: "X",
    description: "desc",
    basePriceCents: 1000,
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

const items: Product[] = [
  item({ id: "1", slug: "catering-box", name: "Turkey Club Box", basePriceCents: 1450, category: "Boxed Lunches" }),
  item({ id: "2", slug: "catering-tray", name: "Wrap Tray", basePriceCents: 12500, category: "Trays" }),
];

function lastCall(method: string) {
  const calls = (fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls;
  return [...calls].reverse().find((c) => (c[1] as RequestInit | undefined)?.method === method);
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "1",
        slug: "catering-box",
        name: "Turkey Club Box",
        basePriceCents: 1500,
        category: "Boxed Lunches",
        image: null,
        isAvailable: true,
        sortOrder: 0,
        description: "desc",
      }),
    })
  );
});

describe("AdminMenuEditor", () => {
  it("renders items grouped by category with prices", () => {
    render(<AdminMenuEditor initialItems={items} />);
    expect(screen.getByText("Boxed Lunches")).toBeInTheDocument();
    expect(screen.getByText("Trays")).toBeInTheDocument();
    expect(screen.getByText("Turkey Club Box")).toBeInTheDocument();
    expect(screen.getByText("$14.50 / person")).toBeInTheDocument();
    expect(screen.getByText("$125.00")).toBeInTheDocument();
  });

  it("edits an item's price and PUTs basePriceCents in cents", async () => {
    const user = userEvent.setup();
    render(<AdminMenuEditor initialItems={items} />);
    await user.click(screen.getByRole("button", { name: "Edit Turkey Club Box" }));
    const price = screen.getByLabelText("Price ($)");
    await user.clear(price);
    await user.type(price, "15.00");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(lastCall("PUT")).toBeTruthy());
    const call = lastCall("PUT")!;
    expect(call[0]).toBe("/api/admin/menu");
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.id).toBe("1");
    expect(body.basePriceCents).toBe(1500);
  });

  it("adds a new item and POSTs basePriceCents in cents", async () => {
    const user = userEvent.setup();
    render(<AdminMenuEditor initialItems={items} />);
    await user.click(screen.getByRole("button", { name: "+ Add menu item" }));
    await user.type(screen.getByLabelText("Name"), "New Box");
    const price = screen.getByLabelText("Price ($)");
    await user.clear(price);
    await user.type(price, "20.00");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(lastCall("POST")).toBeTruthy());
    const call = lastCall("POST")!;
    expect(call[0]).toBe("/api/admin/menu");
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.id).toBeUndefined();
    expect(body.name).toBe("New Box");
    expect(body.basePriceCents).toBe(2000);
    expect(body.category).toBe("Boxed Lunches");
  });

  it("deletes an item via DELETE ?id=", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<AdminMenuEditor initialItems={items} />);
    await user.click(screen.getByRole("button", { name: "Edit Turkey Club Box" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(lastCall("DELETE")).toBeTruthy());
    expect(lastCall("DELETE")![0]).toBe("/api/admin/menu?id=1");
  });
});
