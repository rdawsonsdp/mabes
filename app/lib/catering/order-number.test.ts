import { describe, it, expect, vi } from "vitest";
import { randomOrderNumber, generateOrderNumber } from "./order-number";

describe("randomOrderNumber", () => {
  it("matches MB-#### with 4 digits in 1000-9999", () => {
    for (let i = 0; i < 200; i++) {
      const n = randomOrderNumber();
      expect(n).toMatch(/^MB-\d{4}$/);
      const num = Number(n.slice(3));
      expect(num).toBeGreaterThanOrEqual(1000);
      expect(num).toBeLessThanOrEqual(9999);
    }
  });
});

describe("generateOrderNumber", () => {
  it("returns the first candidate that is not already in the table", async () => {
    // First lookup → exists (data truthy); second → free (data null).
    vi.resetModules();
    const maybeSingle = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: "x" }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    vi.doMock("@/app/lib/supabase/server", () => ({ getSupabase: () => ({ from }) }));
    const { generateOrderNumber } = await import("./order-number");
    const result = await generateOrderNumber();
    expect(result).toMatch(/^MB-\d{4}$/);
    expect(maybeSingle).toHaveBeenCalledTimes(2);
    vi.doUnmock("@/app/lib/supabase/server");
  });
});
