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
  const hasOptions = product.modifierGroups.length > 0;
  const priceCents = productFromPriceCents(product);
  const perPerson = isPerPersonCategory(product.category);
  const base = product.variants.length > 0 ? `from ${formatCents(priceCents)}` : formatCents(priceCents);
  const priceLabel = perPerson ? `${base} / person` : base;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-copper/20 bg-paper shadow-soft">
      {/* food photo */}
      <div className="relative h-44 w-full bg-cream">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cream to-copper/25">
            <span className="font-display text-small uppercase tracking-widest text-copper/70">
              Mabe&apos;s Catering
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-h4 leading-tight text-ink">{product.name}</h3>
            <span className="font-display shrink-0 whitespace-nowrap text-maroon">{priceLabel}</span>
          </div>
          {perPerson && (
            <p className="mt-1 text-xs uppercase tracking-widest text-copper">
              Minimum {PER_PERSON_MIN_GUESTS} guests
            </p>
          )}
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
      </div>
    </article>
  );
}
