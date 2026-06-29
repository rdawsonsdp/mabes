import { describe, it, expect } from "vitest";

describe("vitest smoke test", () => {
  it("runs arithmetic", () => {
    expect(1 + 1).toBe(2);
  });

  it("has jsdom document available", () => {
    const el = document.createElement("div");
    el.textContent = "Mabe's";
    expect(el.textContent).toBe("Mabe's");
  });
});
