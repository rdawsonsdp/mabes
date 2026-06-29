import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement window.scrollTo; stub it to suppress "not implemented" noise.
Object.defineProperty(window, "scrollTo", { value: () => {}, writable: true });
