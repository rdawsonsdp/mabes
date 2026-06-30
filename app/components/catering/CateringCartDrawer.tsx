// mabes/app/components/catering/CateringCartDrawer.tsx
"use client";

import Link from "next/link";
import { useRef } from "react";
import { useCateringCart } from "./CateringCartProvider";
import { useDialog } from "@/app/components/cart/useDialog";
import { formatCents } from "@/app/lib/money";
import { computeCateringTotals, taxRatePercentLabel } from "@/app/lib/catering/config";
import { validateMinimum, validateLeadTime } from "@/app/lib/catering/validation";
import { Bag, Close, Minus, Plus, Trash } from "@/app/components/icons";

export function CateringCartDrawer() {
  const { state, isOpen, closeCart, updateQty, removeItem, clear } = useCateringCart();
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(panelRef, isOpen, closeCart);

  const totals = computeCateringTotals({
    subtotalCents: state.subtotalCents,
    fulfillment: state.fulfillmentType,
    taxExempt: false,
  });
  const minCheck = validateMinimum(state.subtotalCents);
  const leadCheck = validateLeadTime(state.eventDate);
  const canProceed = state.items.length > 0 && minCheck.ok && leadCheck.ok;

  return (
    <>
      <div
        className={`fixed inset-0 z-[90] bg-ink/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Your catering order"
        className={`fixed inset-y-0 right-0 z-[95] flex w-full max-w-md flex-col bg-paper shadow-float outline-none transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-copper/20 px-5 py-4">
          <h2 className="font-display flex items-center gap-2 text-h3 text-ink">
            <Bag className="h-5 w-5 text-copper" />
            Your Catering Order
          </h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-full p-1.5 text-warm-gray transition-colors hover:bg-cream hover:text-ink"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        {state.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <Bag className="h-12 w-12 text-copper/50" />
            <p className="font-display text-h4 text-ink">No items yet</p>
            <p className="text-small text-warm-gray">
              Add boxed lunches, wraps, trays, or add-ons to build your order.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {state.items.map((item) => (
                <div key={item.lineId} className="flex gap-3 border-b border-copper/15 pb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-h4 leading-tight text-ink">{item.name}</h3>
                      <span className="font-display shrink-0 text-maroon">{formatCents(item.lineTotalCents)}</span>
                    </div>
                    {item.selectedModifiers.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-small text-warm-gray">
                        {item.selectedModifiers.map((m, i) => (
                          <li key={`${m.modifierId}-${i}`}>
                            {m.name}
                            {m.priceCents > 0 && ` (+${formatCents(m.priceCents)})`}
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.notes && <p className="mt-1 text-small italic text-warm-gray">&ldquo;{item.notes}&rdquo;</p>}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-pill border border-copper/40 px-1.5 py-1">
                        <button
                          onClick={() => updateQty(item.lineId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          disabled={item.quantity <= 1}
                          className="rounded-full p-0.5 text-maroon transition-colors hover:bg-cream disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-4 text-center text-small text-ink">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.lineId, item.quantity + 1)}
                          aria-label="Increase quantity"
                          disabled={item.quantity >= 99}
                          className="rounded-full p-0.5 text-maroon transition-colors hover:bg-cream disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.lineId)}
                        aria-label={`Remove ${item.name}`}
                        className="inline-flex items-center gap-1 text-small text-warm-gray transition-colors hover:text-maroon"
                      >
                        <Trash className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-copper/20 px-5 py-4">
              <dl className="space-y-1 text-small">
                <div className="flex justify-between">
                  <dt className="text-warm-gray">Subtotal</dt>
                  <dd className="text-ink">{formatCents(totals.subtotalCents)}</dd>
                </div>
                {state.fulfillmentType === "delivery" && (
                  <div className="flex justify-between">
                    <dt className="text-warm-gray">Estimated delivery</dt>
                    <dd className="text-ink">{formatCents(totals.deliveryFeeCents)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-warm-gray">Estimated tax ({taxRatePercentLabel()})</dt>
                  <dd className="text-ink">{formatCents(totals.taxCents)}</dd>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <dt className="font-display text-h4 text-ink">Estimated total</dt>
                  <dd className="font-display text-h3 text-maroon">{formatCents(totals.totalCents)}</dd>
                </div>
              </dl>

              {!minCheck.ok && (
                <p role="alert" className="mt-2 text-small text-maroon">
                  {minCheck.message}
                </p>
              )}
              {minCheck.ok && !leadCheck.ok && (
                <p role="alert" className="mt-2 text-small text-maroon">
                  {leadCheck.message}
                </p>
              )}

              {canProceed ? (
                <Link
                  href="/catering/checkout"
                  onClick={closeCart}
                  className="font-display mt-3 flex w-full items-center justify-center gap-2 rounded-pill bg-maroon py-3.5 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
                >
                  Proceed to checkout
                </Link>
              ) : (
                <button
                  disabled
                  aria-disabled="true"
                  className="font-display mt-3 flex w-full items-center justify-center gap-2 rounded-pill bg-maroon py-3.5 text-small uppercase tracking-widest text-cream opacity-50"
                >
                  Proceed to checkout
                </button>
              )}
              <button
                onClick={clear}
                className="mt-2 w-full text-center text-small text-warm-gray transition-colors hover:text-maroon"
              >
                Clear order
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
