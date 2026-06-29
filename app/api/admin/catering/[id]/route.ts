import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/app/lib/supabase/admin-auth";
import { getCateringOrder, updateCateringOrderStatus } from "@/app/lib/catering/orders";
import { sendCateringCustomerEmail } from "@/app/lib/email/catering-customer-template";
import { sendCateringStaffEmail } from "@/app/lib/email/catering-staff-template";
import type { CateringOrderStatus } from "@/app/lib/catering/types";

const VALID_STATUSES: CateringOrderStatus[] = [
  "quote_requested",
  "pending_payment",
  "paid",
  "confirmed",
  "cancelled",
];

/** Change a catering order's status. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json()) as { status?: string };
  if (!body.status || !VALID_STATUSES.includes(body.status as CateringOrderStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  try {
    const order = await updateCateringOrderStatus(id, body.status as CateringOrderStatus);
    return NextResponse.json({ order });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update status" },
      { status: 500 }
    );
  }
}

/** Resend the confirmation email(s) for an order. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json()) as {
    action?: string;
    recipient?: "customer" | "staff" | "both";
  };
  if (body.action !== "resend") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const order = await getCateringOrder(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const recipient = body.recipient ?? "both";
  const sent: string[] = [];
  try {
    if (recipient === "customer" || recipient === "both") {
      await sendCateringCustomerEmail(order);
      sent.push("customer");
    }
    if (recipient === "staff" || recipient === "both") {
      await sendCateringStaffEmail(order);
      sent.push("staff");
    }
    return NextResponse.json({ success: true, sent });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
