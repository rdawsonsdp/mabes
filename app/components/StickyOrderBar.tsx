"use client";

import { Bag, Phone } from "./icons";
import { PHONE_HREF } from "./ContactBar";
import { useCart } from "./cart/CartProvider";
import { formatCents } from "@/app/lib/money";

// Always-reachable order CTA on mobile. Cart-aware: opens the cart drawer with a
// running total when there are items, otherwise jumps to the menu to start an
// order. Hidden on desktop (the in-menu sticky bar covers that).
export function StickyOrderBar() {
  const { cart, openCart } = useCart();
  const hasItems = cart.itemCount > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex gap-2 border-t border-copper/30 bg-paper/95 p-3 backdrop-blur lg:hidden">
      {hasItems ? (
        <button
          onClick={openCart}
          className="font-display flex flex-1 items-center justify-center gap-2 rounded-pill bg-maroon py-3 text-center text-small tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
        >
          <Bag className="h-4 w-4" />
          View Order · {cart.itemCount} · {formatCents(cart.subtotalCents)}
        </button>
      ) : (
        <a
          href="#menus"
          className="font-display flex-1 rounded-pill bg-maroon py-3 text-center text-small tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
        >
          Start an Order
        </a>
      )}
      <a
        href={PHONE_HREF}
        aria-label="Call"
        className="font-display inline-flex items-center justify-center gap-2 rounded-pill border border-copper px-6 text-small tracking-widest text-copper"
      >
        <Phone className="h-4 w-4" /> Call
      </a>
    </div>
  );
}
