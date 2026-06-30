import Link from "next/link";
import { requireAdmin } from "@/app/lib/supabase/admin-auth";
import { listCateringOrders } from "@/app/lib/catering/admin-queries";
import { formatCents } from "@/app/lib/money";
import { AdminNav } from "@/app/components/admin/AdminNav";
import type { CateringOrderStatus } from "@/app/lib/catering/types";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  quote_requested: "bg-warm-gray/20 text-ink",
  pending_payment: "bg-copper/25 text-maroon",
  paid: "bg-olive/25 text-olive",
  confirmed: "bg-maroon/15 text-maroon",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "quote_requested", label: "Quotes" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "paid", label: "Paid" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_ORDER: CateringOrderStatus[] = [
  "quote_requested",
  "pending_payment",
  "paid",
  "confirmed",
  "cancelled",
];

const STATUS_LABELS: Record<string, string> = {
  quote_requested: "Quote Requested",
  pending_payment: "Pending Payment",
  paid: "Paid",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s.includes("T") ? s : s + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminCateringPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter =
    status && status !== "all" ? (status as CateringOrderStatus) : undefined;
  const orders = await listCateringOrders(filter ? { status: filter } : {});

  // Group orders into bordered sections by status, in workflow order.
  const groups = STATUS_ORDER.map((s) => ({
    status: s,
    orders: orders.filter((o) => o.status === s),
  })).filter((g) => g.orders.length > 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      <div className="mx-auto max-w-[1100px] px-6 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => {
            const active = (status ?? "all") === t.value;
            return (
              <Link
                key={t.value}
                href={t.value === "all" ? "/admin/catering" : `/admin/catering?status=${t.value}`}
                className={`font-display rounded-pill px-4 py-2 text-small tracking-wide transition-colors ${
                  active ? "bg-maroon text-cream" : "bg-paper text-ink hover:bg-cream"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {groups.length === 0 ? (
          <p className="rounded-md bg-paper p-10 text-center text-warm-gray">
            No catering orders yet.
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <section
                key={group.status}
                className="overflow-hidden rounded-md border-2 border-copper/30 bg-paper"
              >
                <div className="flex items-center justify-between border-b border-copper/20 bg-cream/60 px-4 py-2.5">
                  <h2 className="font-display text-h4 text-maroon">
                    <span
                      className={`mr-2 inline-block rounded-pill px-2.5 py-0.5 align-middle text-xs capitalize ${
                        STATUS_STYLES[group.status] ?? "bg-gray-100 text-ink"
                      }`}
                    >
                      {STATUS_LABELS[group.status] ?? group.status.replace(/_/g, " ")}
                    </span>
                  </h2>
                  <span className="text-small text-warm-gray">
                    {group.orders.length} {group.orders.length === 1 ? "order" : "orders"}
                  </span>
                </div>
                <table className="w-full text-left text-small">
                  <thead className="border-b border-copper/20 text-warm-gray">
                    <tr>
                      <th className="px-4 py-2 font-display">Order #</th>
                      <th className="px-4 py-2 font-display">Customer</th>
                      <th className="px-4 py-2 font-display">Event Date</th>
                      <th className="px-4 py-2 font-display">Total</th>
                      <th className="px-4 py-2 font-display">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.orders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-copper/10 last:border-0 hover:bg-cream/40"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/catering/${o.id}`}
                            className="font-display font-bold text-copper hover:text-maroon"
                          >
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-ink">{o.customerName}</div>
                          {o.company && <div className="text-xs text-warm-gray">{o.company}</div>}
                        </td>
                        <td className="px-4 py-3 text-ink">{fmtDate(o.eventDate)}</td>
                        <td className="px-4 py-3 text-ink">{formatCents(o.totalCents)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-pill px-2.5 py-0.5 text-xs ${
                              o.isQuote ? "bg-warm-gray/20 text-ink" : "bg-olive/25 text-olive"
                            }`}
                          >
                            {o.isQuote ? "Quote" : "Paid order"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
