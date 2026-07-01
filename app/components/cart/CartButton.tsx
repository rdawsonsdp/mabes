"use client";

import { useCart } from "./CartProvider";
import { Bag } from "../icons";

// Cart launcher with a live item-count badge. Used in the header (desktop +
// mobile). Hidden-empty? No — we always show it so the cart is discoverable.
export function CartButton({ className = "" }: { className?: string }) {
  const { cart, openCart } = useCart();
  const count = cart.itemCount;
  return (
    <button
      onClick={openCart}
      aria-label={`Open bag${count ? `, ${count} item${count === 1 ? "" : "s"}` : ""}`}
      className={`relative inline-flex items-center justify-center text-ink transition-colors hover:text-copper ${className}`}
    >
      <Bag className="h-6 w-6" />
      {count > 0 && (
        <span className="font-display absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon px-1 text-xs leading-none text-cream">
          {count}
        </span>
      )}
    </button>
  );
}
