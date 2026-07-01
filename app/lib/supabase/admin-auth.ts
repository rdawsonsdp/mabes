import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ADMIN_AUTH_ENABLED } from "./admin-auth-flag";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Stand-in admin identity returned while the login is disabled
// (ADMIN_AUTH_ENABLED === false). Lets pages and API routes treat every
// request as an authorized admin without a real Supabase session.
const DEV_ADMIN = { id: "dev-admin", email: "admin@mabes.com" } as unknown as User;

/**
 * Cookie-aware Supabase client for Server Components and Route Handlers.
 * Uses the anon key + the request's auth cookies so RLS runs as the signed-in
 * admin (FOUNDATIONS §4 grants the `authenticated` role read/update).
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — cookie writes are not allowed here;
          // the middleware (Task 5.2) refreshes the session cookie instead.
        }
      },
    },
  });
}

/** The signed-in Supabase user, or null. */
export async function getAdminUser(): Promise<User | null> {
  if (!ADMIN_AUTH_ENABLED) return DEV_ADMIN; // login temporarily removed
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

/** For server pages: redirect to the login screen when there is no admin user. */
export async function requireAdmin(): Promise<User> {
  if (!ADMIN_AUTH_ENABLED) return DEV_ADMIN; // login temporarily removed
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

/**
 * Pure decision used by the middleware: should a request to `pathname` made by a
 * visitor whose signed-in state is `hasUser` be redirected to /admin/login?
 */
export function shouldRedirectToLogin(pathname: string, hasUser: boolean): boolean {
  if (!ADMIN_AUTH_ENABLED) return false; // login temporarily removed
  if (!pathname.startsWith("/admin")) return false;
  if (pathname === "/admin/login") return false;
  return !hasUser;
}
