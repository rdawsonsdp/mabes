"use client";

// force-dynamic + Suspense boundary: belt-and-suspenders guard against the
// Next 16 static-prerender bailout (R4) caused by useSearchParams().
export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/app/lib/supabase/browser";
import { ADMIN_AUTH_ENABLED } from "@/app/lib/supabase/admin-auth-flag";

const field =
  "w-full rounded-md border border-copper/40 bg-paper px-3 py-2.5 text-body text-ink outline-none focus:border-copper";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin/catering";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createBrowserSupabase();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }
    router.replace(next);
    router.refresh();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-md border border-copper/20 bg-paper p-8 shadow-float"
    >
      <h1 className="font-display text-h3 text-maroon">Mabe&apos;s Admin</h1>
      <p className="mb-6 text-small text-warm-gray">Sign in to manage catering orders.</p>

      <label className="font-display text-small tracking-wide text-maroon" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`${field} mb-4 mt-1`}
      />

      <label className="font-display text-small tracking-wide text-maroon" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={`${field} mb-5 mt-1`}
      />

      {error && <p className="mb-4 text-small text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="font-display w-full rounded-pill bg-maroon py-3 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  // Login is temporarily removed — send anyone who lands here into the admin.
  if (!ADMIN_AUTH_ENABLED) redirect("/admin/catering");
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
