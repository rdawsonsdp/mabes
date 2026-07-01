"use client";

import Image from "next/image";
import type { Product } from "@/app/lib/types";
import { productFromPriceCents } from "@/app/lib/types";
import { formatCents } from "@/app/lib/money";
import { isPerPersonCategory, PER_PERSON_MIN_GUESTS } from "@/app/lib/catering/config";
import { Plus } from "@/app/components/icons";

export function CateringItemCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: (p: Product) => void;
}) {
  const priceCents = productFromPriceCents(product);
  const perPerson = isPerPersonCategory(product.category);
  const base = product.variants.length > 0 ? `from ${formatCents(priceCents)}` : formatCents(priceCents);
  const priceLabel = perPerson ? `${base} / person` : base;

  // The whole card is tappable — opens the item detail popup (mobile-first).
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      aria-label={`Add ${product.name}`}
      className="group relative flex flex-col self-start overflow-hidden rounded-2xl border border-copper/20 bg-paper text-left shadow-soft transition-shadow hover:shadow-float"
    >
      {/* Only show the image area when there's a real photo — no blank placeholder box. */}
      {product.image && (
        <div className="relative aspect-[4/3] w-full bg-cream">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      )}
      <div className={`flex flex-1 flex-col p-3 ${product.image ? "" : "pr-11"}`}>
        <h3 className="font-display text-body leading-tight text-ink">{product.name}</h3>
        <p className="mt-auto pt-2 font-display text-small text-maroon">{priceLabel}</p>
        {perPerson && (
          <p className="text-[11px] uppercase tracking-widest text-copper">
            Min {PER_PERSON_MIN_GUESTS} guests
          </p>
        )}
      </div>
      <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-maroon text-cream shadow-md transition-colors group-hover:bg-copper group-hover:text-maroon">
        <Plus className="h-4 w-4" />
      </span>
    </button>
  );
}
