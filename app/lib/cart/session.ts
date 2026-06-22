import { cookies } from "next/headers";

// The cart is keyed by an opaque, unguessable session id stored in an httpOnly
// cookie. Reading works anywhere; creating/setting only works inside a Server
// Action or Route Handler (Next.js cookie-write constraint), which is exactly
// where the first cart mutation happens.

const COOKIE = "mabes_cart_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Read the existing session id without creating one (safe in Server Components). */
export async function getSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

/** Read or create the session id (only valid in a Server Action / Route Handler). */
export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}
