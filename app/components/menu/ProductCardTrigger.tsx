"use client";

import { useState } from "react";
import type { Product } from "@/app/lib/types";
import { ProductOptionsModal } from "../cart/ProductOptionsModal";

// Makes a whole menu card tappable: clicking anywhere on the card opens the
// order popup (ProductOptionsModal, with the item photo) — no separate "Add to
// Cart" button needed. The card's visual markup is passed as children, so each
// section keeps its own layout while sharing this tap-to-order behavior.
export function ProductCardTrigger({
  product,
  image,
  ariaLabel,
  className,
  children,
}: {
  product: Product;
  image?: string | null;
  ariaLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={ariaLabel} className={className}>
        {children}
      </button>
      {open && (
        <ProductOptionsModal product={product} image={image ?? product.image} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
