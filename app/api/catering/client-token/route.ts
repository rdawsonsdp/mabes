import { NextResponse } from "next/server";
import { braintreePayment } from "@/app/lib/payment/braintree";

// Always run on demand — a client token must be freshly minted per request and
// never cached at the edge.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clientToken = await braintreePayment.createClientToken();
    return NextResponse.json({ clientToken });
  } catch (error) {
    console.error("[catering] client-token error:", error);
    return NextResponse.json(
      { error: "Unable to start payment. Please try again." },
      { status: 500 }
    );
  }
}
