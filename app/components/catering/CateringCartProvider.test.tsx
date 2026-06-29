import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CateringCartProvider,
  useCateringCart,
  CATERING_STORAGE_KEY,
} from "./CateringCartProvider";

function Harness() {
  const { state, isOpen, addItem, updateQty, clear } = useCateringCart();
  return (
    <div>
      <span data-testid="count">{state.itemCount}</span>
      <span data-testid="subtotal">{state.subtotalCents}</span>
      <span data-testid="open">{isOpen ? "open" : "closed"}</span>
      <button
        onClick={() =>
          addItem({
            productId: "p1",
            productSlug: "catering-the-blue-fish-box",
            name: "Blue Fish Box",
            category: "Boxed Lunches",
            image: null,
            quantity: 1,
            unitPriceCents: 1_200,
            selectedModifiers: [],
            notes: null,
          })
        }
      >
        add
      </button>
      <button onClick={() => updateQty(state.items[0]?.lineId ?? "", 4)}>setfour</button>
      <button onClick={clear}>clear</button>
    </div>
  );
}

describe("CateringCartProvider", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("adds an item, recomputes totals, and opens the drawer", async () => {
    const user = userEvent.setup();
    render(
      <CateringCartProvider>
        <Harness />
      </CateringCartProvider>
    );
    expect(screen.getByTestId("count").textContent).toBe("0");
    await user.click(screen.getByText("add"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("subtotal").textContent).toBe("1200");
    expect(screen.getByTestId("open").textContent).toBe("open");
  });

  it("updates quantity and clears", async () => {
    const user = userEvent.setup();
    render(
      <CateringCartProvider>
        <Harness />
      </CateringCartProvider>
    );
    await user.click(screen.getByText("add"));
    await user.click(screen.getByText("setfour"));
    expect(screen.getByTestId("count").textContent).toBe("4");
    expect(screen.getByTestId("subtotal").textContent).toBe("4800");
    await user.click(screen.getByText("clear"));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("persists to sessionStorage", async () => {
    const user = userEvent.setup();
    render(
      <CateringCartProvider>
        <Harness />
      </CateringCartProvider>
    );
    await user.click(screen.getByText("add"));
    await act(async () => {}); // flush the persist effect
    const raw = window.sessionStorage.getItem(CATERING_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).itemCount).toBe(1);
  });
});
