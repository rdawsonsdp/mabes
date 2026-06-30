import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/lib/supabase/admin-auth";
import { getCateringOrder } from "@/app/lib/catering/orders";
import { formatCents } from "@/app/lib/money";
import { taxRatePercentLabel } from "@/app/lib/catering/config";
import { AdminNav } from "@/app/components/admin/AdminNav";
import { AdminCateringActions } from "@/app/components/admin/AdminCateringActions";

export const dynamic = "force-dynamic";

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s.includes("T") ? s : s + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminCateringDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const order = await getCateringOrder(id);
  if (!order) notFound();

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      <div className="mx-auto max-w-[1000px] px-6 py-8">
        <Link href="/admin/catering" className="font-display text-small text-copper hover:text-maroon">
          ‹ Back to orders
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-h2 text-maroon">{order.orderNumber}</h1>
          <span
            className={`rounded-pill px-3 py-0.5 text-xs ${
              order.isQuote ? "bg-warm-gray/20 text-ink" : "bg-olive/25 text-olive"
            }`}
          >
            {order.isQuote ? "Quote" : "Paid order"}
          </span>
          <span className="rounded-pill bg-maroon/15 px-3 py-0.5 text-xs capitalize text-maroon">
            {order.status.replace(/_/g, " ")}
          </span>
          <span className="rounded-pill bg-copper/20 px-3 py-0.5 text-xs capitalize text-maroon">
            payment: {order.paymentStatus}
          </span>
        </div>
        <p className="mt-1 text-small text-warm-gray">Created {fmtDate(order.createdAt)}</p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Left column: order detail */}
          <div className="space-y-6">
            {/* Customer */}
            <section className="rounded-md border border-copper/20 bg-paper p-5">
              <h2 className="font-display text-h4 text-maroon">Customer</h2>
              <div className="mt-2 text-body text-ink">
                <p className="font-display">{order.customerName}</p>
                <p>{order.customerEmail}</p>
                {order.customerPhone && <p>{order.customerPhone}</p>}
                {order.company && <p className="text-warm-gray">{order.company}</p>}
              </div>
            </section>

            {/* Event + fulfillment */}
            <section className="rounded-md border border-copper/20 bg-paper p-5">
              <h2 className="font-display text-h4 text-maroon">Event &amp; Fulfillment</h2>
              <dl className="mt-2 grid grid-cols-2 gap-3 text-body text-ink">
                <div>
                  <dt className="text-xs uppercase text-warm-gray">Date</dt>
                  <dd>{fmtDate(order.eventDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-warm-gray">Time</dt>
                  <dd>{order.eventTime || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-warm-gray">Headcount</dt>
                  <dd>{order.headcount ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-warm-gray">Fulfillment</dt>
                  <dd className="capitalize">{order.fulfillmentType}</dd>
                </div>
                {order.fulfillmentType === "delivery" && (
                  <div className="col-span-2">
                    <dt className="text-xs uppercase text-warm-gray">Delivery address</dt>
                    <dd>{order.deliveryAddress || "—"}</dd>
                  </div>
                )}
              </dl>
              {order.specialInstructions && (
                <div className="mt-3 rounded-md bg-cream/60 p-3">
                  <p className="text-xs uppercase text-warm-gray">Special instructions</p>
                  <p className="text-body text-ink">{order.specialInstructions}</p>
                </div>
              )}
              {order.taxExempt && (
                <div className="mt-3 rounded-md bg-olive/15 p-3">
                  <p className="text-xs uppercase text-olive">Tax exempt</p>
                  {order.taxExemptCertificateUrl ? (
                    <a
                      href={order.taxExemptCertificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-small text-copper underline-offset-4 hover:underline"
                    >
                      View certificate
                    </a>
                  ) : (
                    <p className="text-small text-warm-gray">No certificate on file</p>
                  )}
                </div>
              )}
            </section>

            {/* Items */}
            <section className="rounded-md border border-copper/20 bg-paper p-5">
              <h2 className="font-display text-h4 text-maroon">Items ({order.items.length})</h2>
              <table className="mt-3 w-full text-left text-small">
                <thead className="border-b border-copper/20">
                  <tr>
                    <th className="py-2 font-display text-maroon">Item</th>
                    <th className="py-2 font-display text-maroon">Qty</th>
                    <th className="py-2 text-right font-display text-maroon">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, i) => (
                    <tr key={i} className="border-b border-copper/10 last:border-0 align-top">
                      <td className="py-2 text-ink">
                        <div className="font-display">{it.name}</div>
                        {it.selectedModifiers.length > 0 && (
                          <div className="text-xs text-warm-gray">
                            {it.selectedModifiers.map((m) => m.name).join(", ")}
                          </div>
                        )}
                        {it.notes && <div className="text-xs text-warm-gray">Note: {it.notes}</div>}
                      </td>
                      <td className="py-2 text-ink">{it.quantity}</td>
                      <td className="py-2 text-right text-ink">{formatCents(it.lineTotalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {order.adminNotes && (
              <section className="rounded-md border border-copper/20 bg-paper p-5">
                <h2 className="font-display text-h4 text-maroon">Admin notes</h2>
                <p className="mt-2 whitespace-pre-wrap text-body text-ink">{order.adminNotes}</p>
              </section>
            )}
          </div>

          {/* Right column: actions + totals */}
          <div className="space-y-6">
            <AdminCateringActions order={order} />

            <div className="rounded-md border border-copper/20 bg-cream/60 p-5">
              <h2 className="font-display text-h4 text-maroon">Totals</h2>
              <dl className="mt-3 space-y-2 text-body text-ink">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{formatCents(order.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Delivery</dt>
                  <dd>{formatCents(order.deliveryFeeCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Tax{order.taxExempt ? " (exempt)" : ` (${taxRatePercentLabel()})`}</dt>
                  <dd>{formatCents(order.taxCents)}</dd>
                </div>
                <div className="flex justify-between border-t border-copper/30 pt-2 font-display text-h4">
                  <dt className="text-maroon">Total</dt>
                  <dd className="text-maroon">{formatCents(order.totalCents)}</dd>
                </div>
              </dl>
              {order.paymentTransactionId && (
                <p className="mt-3 text-xs text-warm-gray">
                  Txn: <span className="font-mono">{order.paymentTransactionId}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
