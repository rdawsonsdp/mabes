import { NextResponse, type NextRequest } from "next/server";
import { getSupabase } from "@/app/lib/supabase/server";
import { validateVipSignup } from "@/app/lib/vip/validation";

// POST /api/vip — capture a VIP-list signup from the marketing popup into the
// `customers` table. Upserts on email so a repeat signup refreshes the record
// instead of erroring. Writes with the service-role client (bypasses RLS).
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = validateVipSignup((body ?? {}) as Record<string, unknown>);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, email, phone, consentEmail, consentSms } = parsed.value;

  const { error } = await getSupabase()
    .from("customers")
    .upsert(
      {
        name,
        email,
        phone,
        consent_email: consentEmail,
        consent_sms: consentSms,
        source: "vip_popup",
      },
      { onConflict: "email" }
    );

  if (error) {
    console.error("[vip] signup insert failed:", error.message);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
