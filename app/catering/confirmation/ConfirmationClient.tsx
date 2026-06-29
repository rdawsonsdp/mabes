"use client";

import { useEffect, useState } from "react";
import { downloadCateringOrderPdf } from "@/app/lib/catering/pdf";
import { formatCents } from "@/app/lib/money";
import { PHONE_DISPLAY, PHONE_HREF, CATERING_EMAIL, ADDRESS } from "@/app/components/ContactBar";
import type { CateringOrderRecord } from "@/app/lib/catering/types";

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ConfirmationClient() {
  const [order, setOrder] = useState<CateringOrderRecord | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("mabes-last-catering-order");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional mount-time sessionStorage load
      if (raw) setOrder(JSON.parse(raw) as CateringOrderRecord);
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-h2 text-ink">No recent catering order found</h1>
        <p className="mt-2 text-warm-gray">Start a new catering order to see your confirmation here.</p>
        <a
          href="/catering/menu"
          className="font-display mt-6 inline-block rounded-pill bg-maroon px-8 py-3 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
        >
          Browse the Catering Menu
        </a>
      </div>
    );
  }

  const isQuote = order.isQuote;

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-maroon py-14 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-olive text-cream">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display mt-4 text-h1 tracking-wide text-cream">
          {isQuote ? "Your Quote Request Is In!" : "Your Order Is Confirmed!"}
        </h1>
        <p className="mt-1 text-small uppercase tracking-widest text-copper">
          {isQuote ? "Quote" : "Order"} #{order.orderNumber}
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-center text-warm-gray">
          {isQuote
            ? "We've emailed a copy of this quote and will reach out within 1 business day to confirm details."
            : "We've emailed your confirmation. Our team will follow up to finalize your event."}
        </p>

        <section className="mt-8 rounded-2xl border border-copper/20 bg-paper p-6">
          <h2 className="font-display mb-4 text-h3 text-ink">Order Summary</h2>
          <ul className="space-y-3">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-2 border-b border-copper/15 pb-3 last:border-0">
                <span className="min-w-0">
                  <span className="font-display block text-h4 text-ink">{item.name}</span>
                  <span className="text-xs text-warm-gray">
                    Qty {item.quantity}
                    {item.selectedModifiers.length > 0 &&
                      " · " + item.selectedModifiers.map((m) => m.name).join(", ")}
                  </span>
                </span>
                <span className="font-display shrink-0 text-maroon">{formatCents(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 text-small text-ink">
            <div className="flex justify-between"><span className="text-warm-gray">Subtotal</span><span>{formatCents(order.subtotalCents)}</span></div>
            <div className="flex justify-between"><span className="text-warm-gray">Delivery</span><span>{formatCents(order.deliveryFeeCents)}</span></div>
            <div className="flex justify-between"><span className="text-warm-gray">{order.taxExempt ? "Tax (exempt)" : "Tax"}</span><span>{formatCents(order.taxCents)}</span></div>
            <div className="mt-2 flex justify-between border-t border-maroon/30 pt-2">
              <span className="font-display text-h4 text-ink">Total</span>
              <span className="font-display text-h3 text-maroon">{formatCents(order.totalCents)}</span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 rounded-2xl border border-copper/20 bg-paper p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-warm-gray">Contact</p>
            <p className="text-ink">{order.customerName}</p>
            <p className="text-small text-warm-gray">{order.customerEmail}</p>
            {order.customerPhone && <p className="text-small text-warm-gray">{order.customerPhone}</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-warm-gray">
              {order.fulfillmentType === "delivery" ? "Delivery To" : "Pickup At"}
            </p>
            <p className="text-ink">
              {order.fulfillmentType === "delivery" ? order.deliveryAddress : ADDRESS}
            </p>
            <p className="mt-2 text-xs uppercase tracking-wide text-warm-gray">Date & Time</p>
            <p className="text-ink">{formatEventDate(order.eventDate)}</p>
            {order.eventTime && <p className="text-small text-warm-gray">{order.eventTime}</p>}
          </div>
        </section>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            onClick={() => downloadCateringOrderPdf(order)}
            className="font-display rounded-pill bg-maroon px-8 py-3 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
          >
            Download PDF
          </button>
          <a
            href="/catering/menu"
            className="font-display rounded-pill border border-maroon px-8 py-3 text-center text-small uppercase tracking-widest text-maroon transition-colors hover:bg-maroon hover:text-cream"
          >
            Start a New Order
          </a>
          <a
            href={PHONE_HREF}
            className="font-display rounded-pill border border-copper px-8 py-3 text-center text-small uppercase tracking-widest text-copper transition-colors hover:bg-copper hover:text-cream"
          >
            Call {PHONE_DISPLAY}
          </a>
        </div>
        <p className="mt-4 text-center text-xs text-warm-gray">
          Questions? Email <a className="text-copper underline" href={`mailto:${CATERING_EMAIL}`}>{CATERING_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
