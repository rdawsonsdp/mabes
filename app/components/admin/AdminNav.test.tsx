import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const mockPathname = vi.fn(() => "/admin/menu");
const mockRouterReplace = vi.fn();
const mockRouterRefresh = vi.fn();
const mockSignOut = vi.fn(() => Promise.resolve({ error: null }));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ replace: mockRouterReplace, refresh: mockRouterRefresh }),
}));

vi.mock("@/app/lib/supabase/browser", () => ({
  createBrowserSupabase: () => ({ auth: { signOut: mockSignOut } }),
}));

import { AdminNav } from "./AdminNav";

describe("AdminNav", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/admin/menu");
    mockRouterReplace.mockReset();
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue({ error: null });
  });

  it("renders a link to /admin/menu labelled Menu", () => {
    render(<AdminNav />);
    const link = screen.getByRole("link", { name: /menu/i });
    expect(link).toHaveAttribute("href", "/admin/menu");
  });

  it("renders a link to /admin/catering labelled Orders", () => {
    render(<AdminNav />);
    const link = screen.getByRole("link", { name: /orders/i });
    expect(link).toHaveAttribute("href", "/admin/catering");
  });

  it("renders the brand text 'Mabe's Admin'", () => {
    render(<AdminNav />);
    // The brand may be a link or a span; just check it's present
    expect(screen.getByText(/Mabe.*Admin/i)).toBeInTheDocument();
  });

  it("applies an active class to the Menu link when pathname is /admin/menu", () => {
    mockPathname.mockReturnValue("/admin/menu");
    render(<AdminNav />);
    const link = screen.getByRole("link", { name: /menu/i });
    // Active link has bg-cream class (applied by the component)
    expect(link).toHaveClass("bg-cream");
  });

  it("applies an active class to the Orders link when pathname starts with /admin/catering", () => {
    mockPathname.mockReturnValue("/admin/catering");
    render(<AdminNav />);
    const link = screen.getByRole("link", { name: /orders/i });
    expect(link).toHaveClass("bg-cream");
  });

  it("renders a Sign out button", () => {
    render(<AdminNav />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
