// Errors whose message is safe to show the customer. Anything that is NOT a
// UserError (e.g. a raw Supabase/Postgres error) must be genericized before it
// crosses the server-action boundary, so internal schema details never leak.
export class UserError extends Error {}
