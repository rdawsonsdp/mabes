"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/app/lib/supabase/browser";

const LINKS: { href: string; label: string }[] = [
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/catering", label: "Orders" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await createBrowserSupabase().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="flex items-center justify-between bg-maroon px-6 py-3 text-cream">
      {/* Brand */}
      <div className="flex items-center gap-6">
        <Link
          href="/admin/catering"
          className="font-display text-h4 hover:text-copper"
        >
          Mabe&apos;s Admin
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`font-display rounded-pill px-4 py-1.5 text-small tracking-wide transition-colors ${
                  active
                    ? "bg-cream text-maroon"
                    : "text-cream/80 hover:bg-cream/20"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sign out */}
      <button
        onClick={signOut}
        className="font-display rounded-pill border border-cream/40 px-4 py-1.5 text-small tracking-wide transition-colors hover:bg-cream hover:text-maroon"
      >
        Sign out
      </button>
    </header>
  );
}
