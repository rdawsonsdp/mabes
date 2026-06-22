import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client. Prefers the service_role key (bypasses RLS) when
// configured; otherwise falls back to the anon/publishable key, which works
// today against the pre-Clover permissive cart RLS policies. The service_role
// key is NOT a NEXT_PUBLIC var, so it is never shipped to the browser bundle.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const usingServiceRole = Boolean(serviceKey);

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set — check .env.local");
  }
  const key = serviceKey || anonKey;
  if (!key) {
    throw new Error(
      "No Supabase key set — add SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
    );
  }
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
