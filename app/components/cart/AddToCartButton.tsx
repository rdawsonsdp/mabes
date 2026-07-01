"use client";

import { useState } from "react";
import type { Product } from "@/app/lib/types";
import { useCart } from "./CartProvider";
import { ProductOptionsModal } from "./ProductOptionsModal";
import { Check, Plus, Spinner } from "../icons";

// Single entry point for adding any product. If the product has sizes or
// modifier groups, it opens the options modal; otherwise it adds one straight to
// the cart with a quick confirmation flash.
export function AddToCartButton({
  product,
  className,
  label = "Add to Bag",
}: {
  product: Product;
  className?: string;
  label?: string;
}) {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);

  const hasOptions = product.variants.length > 0 || product.modifierGroups.length > 0;

  async function handleClick() {
    if (hasOptions) {
      setOpen(true);
      return;
    }
    setBusy(true);
    const res = await addItem({
      productId: product.id,
      variantId: null,
      modifierIds: [],
      quantity: 1,
      notes: null,
    });
    setBusy(false);
    if (res.ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-busy={busy}
        aria-label={`Add ${product.name} to bag`}
        className={
          className ??
          "font-display inline-flex items-center gap-1.5 rounded-pill bg-maroon px-4 py-2 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon disabled:opacity-70"
        }
      >
        {busy ? (
          <Spinner className="h-4 w-4 animate-spin" />
        ) : added ? (
          <>
            <Check className="h-4 w-4" /> Added
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" /> {hasOptions ? "Add to Bag" : label}
          </>
        )}
      </button>
      {open && <ProductOptionsModal product={product} onClose={() => setOpen(false)} />}
    </>
  );
}
