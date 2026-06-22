"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { useDialog } from "./useDialog";
import { formatCents } from "@/app/lib/money";
import { Bag, Check, Close, Minus, Plus, Spinner, Trash } from "../icons";

// Right-side slide-out cart. Three states: the line-item list, an empty state,
// and the post-checkout "Coming Soon" confirmation (the order is saved to the DB
// now; the Clover push is wired in later).

// "No combo" and other zero-cost "none" picks are noise in the summary.
const isNoise = (name: string, priceCents: number) => priceCents === 0 && /^no\b/i.test(name);

export function CartDrawer() {
  const { cart, isOpen, closeCart, updateQty, removeItem, clear, checkout, pending, error, clearError } =
    useCart();
  const [phase, setPhase] = useState<"cart" | "confirmed">("cart");
  const [confirmation, setConfirmation] = useState<{ orderNumber: number; totalCents: number } | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useDialog(panelRef, isOpen, closeCart);

  // Reset to a fresh cart view each time the drawer is (re)opened. Checkout sets
  // the confirmed phase while the drawer is already open, so it isn't clobbered;
  // closing keeps the confirmation visible during the slide-out animation.
  useEffect(() => {
    if (isOpen) {
      setPhase("cart");
      setConfirmation(null);
      setCheckoutError(null);
      clearError();
    }
  }, [isOpen, clearError]);

  async function handleCheckout() {
    setCheckingOut(true);
    setCheckoutError(null);
    const res = await checkout();
    setCheckingOut(false);
    if (res.ok) {
      setConfirmation({ orderNumber: res.orderNumber, totalCents: res.totalCents });
      setPhase("confirmed");
    } else {
      setCheckoutError(res.error ?? "Checkout failed. Please try again.");
    }
  }

  const shownError = checkoutError || error;

  return (
    <>
      {/* overlay */}
      <div
        className={`fixed inset-0 z-[90] bg-ink/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden
      />

      {/* panel */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Your order"
        className={`fixed inset-y-0 right-0 z-[95] flex w-full max-w-md flex-col bg-paper shadow-float outline-none transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-copper/20 px-5 py-4">
          <h2 className="font-display flex items-center gap-2 text-h3 text-ink">
            <Bag className="h-5 w-5 text-copper" />
            {phase === "confirmed" ? "Order Received" : "Your Order"}
          </h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="rounded-full p-1.5 text-warm-gray transition-colors hover:bg-cream hover:text-ink"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        {phase === "confirmed" && confirmation ? (
          <ConfirmationView
            orderNumber={confirmation.orderNumber}
            totalCents={confirmation.totalCents}
            onDone={closeCart}
          />
        ) : cart.items.length === 0 ? (
          <EmptyView onBrowse={closeCart} />
        ) : (
          <>
            {/* items */}
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-copper/15 pb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-h4 leading-tight text-ink">{item.name}</h3>
                      <span className="font-display shrink-0 text-maroon">
                        {formatCents(item.lineTotalCents)}
                      </span>
                    </div>
                    {item.variantName && (
                      <p className="text-xs uppercase tracking-wide text-copper">{item.variantName}</p>
                    )}
                    {item.modifiers.filter((m) => !isNoise(m.name, m.priceCents)).length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-small text-warm-gray">
                        {item.modifiers
                          .filter((m) => !isNoise(m.name, m.priceCents))
                          .map((m, i) => (
                            <li key={`${m.modifierId}-${i}`}>
                              {m.name}
                              {m.priceCents > 0 && ` (+${formatCents(m.priceCents)})`}
                            </li>
                          ))}
                      </ul>
                    )}
                    {item.notes && (
                      <p className="mt-1 text-small italic text-warm-gray">“{item.notes}”</p>
                    )}

                    {/* qty + remove */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center gap-2 rounded-pill border border-copper/40 px-1.5 py-1">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          disabled={checkingOut || item.quantity <= 1}
                          className="rounded-full p-0.5 text-maroon transition-colors hover:bg-cream disabled:opacity-40"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-4 text-center text-small text-ink">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                          disabled={checkingOut || item.quantity >= 99}
                          className="rounded-full p-0.5 text-maroon transition-colors hover:bg-cream disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                        disabled={checkingOut}
                        className="inline-flex items-center gap-1 text-small text-warm-gray transition-colors hover:text-maroon disabled:opacity-40"
                      >
                        <Trash className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* footer / checkout */}
            <div className="border-t border-copper/20 px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-h4 text-ink">Subtotal</span>
                <span className="font-display text-h3 text-maroon">
                  {formatCents(cart.subtotalCents)}
                </span>
              </div>
              <p className="mt-1 text-xs text-warm-gray">
                Taxes calculated at checkout. Pickup at 312 E 75th St.
              </p>
              {shownError && (
                <p role="alert" className="mt-2 text-small text-maroon">
                  {shownError}
                </p>
              )}
              <button
                onClick={handleCheckout}
                disabled={checkingOut || pending}
                aria-busy={checkingOut}
                className="font-display mt-3 flex w-full items-center justify-center gap-2 rounded-pill bg-maroon py-3.5 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon disabled:opacity-70"
              >
                {checkingOut ? (
                  <>
                    <Spinner className="h-4 w-4 animate-spin" /> Placing…
                  </>
                ) : (
                  "Checkout"
                )}
              </button>
              <button
                onClick={clear}
                disabled={pending || checkingOut}
                className="mt-2 w-full text-center text-small text-warm-gray transition-colors hover:text-maroon disabled:opacity-40"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function EmptyView({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <Bag className="h-12 w-12 text-copper/50" />
      <p className="font-display text-h4 text-ink">Your cart is empty</p>
      <p className="text-small text-warm-gray">Add a sandwich, salad, or smoothie to get started.</p>
      <a
        href="#menus"
        onClick={onBrowse}
        className="font-display mt-2 rounded-pill bg-maroon px-8 py-3 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
      >
        Browse the Menu
      </a>
    </div>
  );
}

function ConfirmationView({
  orderNumber,
  totalCents,
  onDone,
}: {
  orderNumber: number;
  totalCents: number;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-olive/15 text-olive">
        <Check className="h-8 w-8" />
      </div>
      <p className="font-display text-h3 text-ink">Thanks — order saved!</p>
      <div className="rounded-xl border border-copper/30 bg-cream px-6 py-4">
        <p className="font-display text-small uppercase tracking-widest text-copper">
          Clover Order to be created
        </p>
        <p className="font-display mt-1 text-h2 text-maroon">Coming Soon</p>
      </div>
      <p className="text-small text-warm-gray">
        Order <span className="font-display text-ink">#{orderNumber}</span> · {formatCents(totalCents)}
        <br />
        We&apos;ve recorded your order. Online payment &amp; Clover sync are on the way.
      </p>
      <button
        onClick={onDone}
        className="font-display mt-2 rounded-pill border border-copper px-8 py-3 text-small uppercase tracking-widest text-copper transition-colors hover:bg-copper hover:text-cream"
      >
        Done
      </button>
    </div>
  );
}
