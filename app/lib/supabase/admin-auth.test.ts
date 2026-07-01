import { describe, it, expect, vi, beforeEach } from "vitest";

const getUser = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: () => {} })),
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser } }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
// Exercise the real auth logic even though the login is currently disabled in
// production (ADMIN_AUTH_ENABLED === false). These assertions describe the
// behavior that returns when the flag is flipped back on.
vi.mock("./admin-auth-flag", () => ({ ADMIN_AUTH_ENABLED: true }));

import { getAdminUser, shouldRedirectToLogin } from "./admin-auth";

describe("shouldRedirectToLogin", () => {
  it("redirects unauthenticated requests to /admin pages", () => {
    expect(shouldRedirectToLogin("/admin/catering", false)).toBe(true);
    expect(shouldRedirectToLogin("/admin/catering/123", false)).toBe(true);
  });
  it("allows authenticated requests through", () => {
    expect(shouldRedirectToLogin("/admin/catering", true)).toBe(false);
  });
  it("never redirects the login page itself", () => {
    expect(shouldRedirectToLogin("/admin/login", false)).toBe(false);
  });
  it("ignores non-admin paths", () => {
    expect(shouldRedirectToLogin("/catering/menu", false)).toBe(false);
  });
});

describe("getAdminUser", () => {
  beforeEach(() => getUser.mockReset());
  it("returns the user when present", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    expect(await getAdminUser()).toEqual({ id: "u1" });
  });
  it("returns null on error", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "no session" } });
    expect(await getAdminUser()).toBeNull();
  });
});
