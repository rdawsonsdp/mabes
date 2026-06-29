// mabes/app/components/catering/FulfillmentBar.test.tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CateringCartProvider } from "./CateringCartProvider";
import { FulfillmentBar } from "./FulfillmentBar";
import { earliestEventDate } from "@/app/lib/catering/config";

function renderBar() {
  return render(
    <CateringCartProvider>
      <FulfillmentBar />
    </CateringCartProvider>
  );
}

describe("FulfillmentBar", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("defaults to pickup and toggles to delivery", async () => {
    const user = userEvent.setup();
    renderBar();
    const pickup = screen.getByRole("tab", { name: "Pickup" });
    const delivery = screen.getByRole("tab", { name: "Delivery" });
    expect(pickup).toHaveAttribute("aria-selected", "true");
    await user.click(delivery);
    expect(delivery).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Delivery fee added at checkout/i)).toBeInTheDocument();
  });

  it("sets the date input min to the earliest lead-time date", () => {
    renderBar();
    const date = screen.getByLabelText("Event date") as HTMLInputElement;
    expect(date.min).toBe(earliestEventDate());
  });

  it("shows a lead-time error for a too-soon date", async () => {
    const user = userEvent.setup();
    renderBar();
    const date = screen.getByLabelText("Event date") as HTMLInputElement;
    await user.type(date, "2020-01-01");
    expect(screen.getByRole("alert")).toHaveTextContent(/days' notice/i);
  });
});
