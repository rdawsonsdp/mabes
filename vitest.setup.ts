import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement window.scrollTo; stub it to suppress "not implemented" noise.
// Guarded for node-environment test files where `window` is undefined.
if (typeof window !== "undefined") {
  Object.defineProperty(window, "scrollTo", { value: () => {}, writable: true });
}
