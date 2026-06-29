"use client";

import type { Product } from "@/app/lib/types";
import { productFromPriceCents } from "@/app/lib/types";
import { formatCents } from "@/app/lib/money";
import { Plus } from "@/app/components/icons";

export function CateringItemCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: (p: Product) => void;
}) {
  const hasOptions = product.modifierGroups.length > 0;
  const priceCents = productFromPriceCents(product);
  const priceLabel = product.variants.length > 0 ? `from ${formatCents(priceCents)}` : formatCents(priceCents);

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-copper/20 bg-paper p-5 shadow-soft">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-h4 leading-tight text-ink">{product.name}</h3>
          <span className="font-display shrink-0 text-maroon">{priceLabel}</span>
        </div>
        {product.description && (
          <p className="mt-2 text-small text-warm-gray">{product.description}</p>
        )}
        {hasOptions && (
          <p className="mt-2 text-xs uppercase tracking-widest text-copper">Options available</p>
        )}
      </div>
      <button
        onClick={() => onSelect(product)}
        aria-label={`Add ${product.name}`}
        className="font-display mt-4 inline-flex items-center justify-center gap-2 self-start rounded-pill bg-maroon px-5 py-2.5 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
      >
        <Plus className="h-4 w-4" />
        {hasOptions ? "Choose options" : "Add"}
      </button>
    </article>
  );
}
