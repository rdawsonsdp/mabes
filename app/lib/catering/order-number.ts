import { getSupabase } from "@/app/lib/supabase/server";

// MB-#### order numbers (LB used LB-#### random 1000-9999). order_number is
// UNIQUE in the DB; we still pre-check to avoid a noisy insert conflict.

export function randomOrderNumber(): string {
  return `MB-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

export async function generateOrderNumber(maxAttempts = 10): Promise<string> {
  const supabase = getSupabase();
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = randomOrderNumber();
    const { data, error } = await supabase
      .from("catering_orders")
      .select("id")
      .eq("order_number", candidate)
      .maybeSingle();
    if (error) throw new Error(`Order number check failed: ${error.message}`);
    if (!data) return candidate;
  }
  throw new Error("Could not generate a unique catering order number");
}
