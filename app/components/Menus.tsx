"use client";

import { useState } from "react";
import type { MenuGroup, Product } from "@/app/lib/types";
import { formatCents } from "@/app/lib/money";
import { AddToCartButton } from "./cart/AddToCartButton";
import { useCart } from "./cart/CartProvider";
import { Bag } from "./icons";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// The price label shown on a menu row: variant-priced items list every size,
// single-priced items show their price.
function priceLabel(p: Product): string {
  if (p.variants.length > 0) {
    return p.variants.map((v) => `${v.name} ${formatCents(v.priceCents)}`).join(" · ");
  }
  return p.basePriceCents != null ? formatCents(p.basePriceCents) : "";
}

// Menu page: big MENUS title, menu-type tabs + a cart button, a category
// sub-nav, then a grid of items with names, prices, descriptions, and an
// Add-to-Cart action. Content + pricing come from the catalog (Supabase).
export function Menus({ menus }: { menus: MenuGroup[] }) {
  const [active, setActive] = useState(0);
  const { cart, openCart } = useCart();
  const menu = menus[active];

  if (!menu) return null;

  return (
    <section id="menus" className="scroll-mt-32 bg-paper py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="font-display text-center text-h1 uppercase tracking-wide text-ink md:text-hero">
          Menus
        </h2>

        {/* menu-type tabs + cart — sticky so ordering stays one tap away */}
        <div className="sticky top-[88px] z-20 -mx-6 mt-8 flex flex-col items-center gap-3 bg-paper/95 px-6 py-3 backdrop-blur lg:top-[100px]">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {menus.map((m, i) => (
              <button
                key={m.menu}
                onClick={() => setActive(i)}
                className={`font-display px-7 py-2.5 text-small uppercase tracking-widest transition-colors ${
                  i === active ? "bg-copper text-cream" : "border border-copper/50 text-copper hover:bg-cream"
                }`}
              >
                {m.menu}
              </button>
            ))}
            <button
              onClick={openCart}
              className="font-display inline-flex items-center gap-2 rounded-pill bg-maroon px-7 py-2.5 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
            >
              <Bag className="h-4 w-4" />
              {cart.itemCount > 0 ? `View Cart · ${formatCents(cart.subtotalCents)}` : "View Cart"}
            </button>
          </div>
        </div>

        {/* subtitle */}
        <div className="mt-12 text-center">
          <p className="font-display text-h4 uppercase tracking-wide text-copper">The Mabe&apos;s Menu</p>
        </div>

        {/* category sub-nav */}
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {menu.categories.map((sec, i) => (
            <span key={sec.category} className="flex items-center gap-x-6">
              {i > 0 && <span className="h-4 w-px bg-copper/40" aria-hidden />}
              <a
                href={`#cat-${slug(sec.category)}`}
                className="font-display text-small uppercase tracking-wide text-copper transition-colors hover:text-ink"
              >
                {sec.category}
              </a>
            </span>
          ))}
        </nav>

        {/* items grouped by category */}
        <div className="mt-16 space-y-16">
          {menu.categories.map((sec) => (
            <div key={sec.category} id={`cat-${slug(sec.category)}`} className="scroll-mt-32">
              <h3 className="font-display text-h2 uppercase tracking-wide text-maroon">{sec.category}</h3>
              <div className="mt-8 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {sec.products.map((p) => (
                  <div key={p.id} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3 border-b border-copper/25 pb-2">
                      <h4 className="font-display text-h3 uppercase leading-tight text-ink">{p.name}</h4>
                      {priceLabel(p) && (
                        <span className="shrink-0 font-display text-small text-maroon">{priceLabel(p)}</span>
                      )}
                    </div>
                    {p.description && <p className="text-small text-warm-gray">{p.description}</p>}
                    <div className="mt-1">
                      <AddToCartButton product={p} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
