"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabase } from "@/app/lib/supabase/browser";
import { ADMIN_AUTH_ENABLED } from "@/app/lib/supabase/admin-auth-flag";

/** Top bar for every admin page: brand + title + sign-out. */
export function AdminBar({ title }: { title: string }) {
  const router = useRouter();

  const signOut = async () => {
    await createBrowserSupabase().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="flex items-center justify-between bg-maroon px-6 py-4 text-cream">
      <div className="flex items-center gap-3">
        <Link href="/admin/catering" className="font-display text-h4 hover:text-copper">
          Mabe&apos;s Admin
        </Link>
        <span className="text-cream/50">/</span>
        <span className="font-display text-h4">{title}</span>
      </div>
      {ADMIN_AUTH_ENABLED && (
        <button
          onClick={signOut}
          className="font-display rounded-pill border border-cream/40 px-4 py-1.5 text-small tracking-wide transition-colors hover:bg-cream hover:text-maroon"
        >
          Sign out
        </button>
      )}
    </header>
  );
}
