// TEMPORARY: the admin login was removed at the user's request ("remove the
// login from this app for now. We will add it back later.").
//
// While ADMIN_AUTH_ENABLED is false, the entire /admin area (catering orders +
// menu editor + their APIs) is PUBLICLY REACHABLE with no sign-in. This is
// intentional for now but must be re-enabled before real go-live.
//
// To restore the login gate: set this back to `true` and create the
// admin@mabes.com Supabase Auth user. Nothing else needs to change — the auth
// helpers, middleware, admin bar, and login page all key off this flag.
//
// Kept in its own tiny, import-free module so both server code (admin-auth.ts,
// middleware) and client components (AdminBar, login page) can read it without
// pulling `next/headers` into the client bundle.
export const ADMIN_AUTH_ENABLED = false;
