"use client";

import Image from "next/image";
import { useState } from "react";
import type { MenuGroup, Product } from "@/app/lib/types";
import { formatCents } from "@/app/lib/money";
import { ProductCardTrigger } from "./menu/ProductCardTrigger";
import { useCart } from "./cart/CartProvider";
import { Bag, Plus } from "./icons";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// The price label shown on a menu row: variant-priced items list every size,
// single-priced items show their price.
function priceLabel(p: Product): string {
  if (p.variants.length > 0) {
    return p.variants.map((v) => `${v.name} ${formatCents(v.priceCents)}`).join(" · ");
  }
  return p.basePriceCents != null ? formatCents(p.basePriceCents) : "";
}

// Menu page: MENUS title, menu-type tabs + a cart button, a sticky category
// quick-nav pill strip, then a mobile-first grid of item cards with names,
// prices, descriptions, and an Add-to-Cart action. Content + pricing come
// from the catalog (Supabase).
export function Menus({ menus }: { menus: MenuGroup[] }) {
  const [active, setActive] = useState(0);
  const { cart, openCart } = useCart();
  const menu = menus[active];

  if (!menu) return null;

  return (
    <section id="menus" className="scroll-mt-32 bg-paper py-12 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-h2 uppercase tracking-wide text-ink sm:text-h1 md:text-hero">
            Menus
          </h2>
          <p className="mt-2 font-display text-small uppercase tracking-wide text-copper sm:text-h4">
            The Mabe&apos;s Menu
          </p>
        </div>

        {/* sticky control bar: menu switcher + cart, then category quick-nav pills */}
        <div className="sticky top-[88px] z-20 -mx-4 mt-6 space-y-2.5 border-b border-copper/10 bg-paper/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:mt-8 sm:space-y-3 sm:px-6 sm:py-3 lg:top-[100px]">
          {/* menu switcher + cart */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {menus.map((m, i) => (
              <button
                key={m.menu}
                onClick={() => setActive(i)}
                className={`font-display rounded-pill px-4 py-2 text-xs uppercase tracking-widest transition-colors sm:px-7 sm:text-small ${
                  i === active ? "bg-copper text-cream" : "border border-copper/50 text-copper hover:bg-cream"
                }`}
              >
                {m.menu}
              </button>
            ))}
            <button
              onClick={openCart}
              className="font-display inline-flex items-center gap-1.5 rounded-pill bg-maroon px-4 py-2 text-xs uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon sm:px-7 sm:text-small"
            >
              <Bag className="h-4 w-4" />
              {cart.itemCount > 0 ? `Cart · ${formatCents(cart.subtotalCents)}` : "Cart"}
            </button>
          </div>

          {/* category quick-nav pills — horizontally scrollable on mobile */}
          <nav
            aria-label="Jump to a category"
            className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center sm:overflow-visible"
          >
            {menu.categories.map((sec) => (
              <a
                key={sec.category}
                href={`#cat-${slug(sec.category)}`}
                className="font-display shrink-0 whitespace-nowrap rounded-pill border border-copper/40 bg-paper px-4 py-1.5 text-xs uppercase tracking-widest text-copper transition-colors hover:bg-copper hover:text-cream"
              >
                {sec.category}
              </a>
            ))}
          </nav>
        </div>

        {/* items grouped by category */}
        <div className="mt-8 space-y-10 sm:mt-12 sm:space-y-14">
          {menu.categories.map((sec) => (
            <div key={sec.category} id={`cat-${slug(sec.category)}`} className="scroll-mt-[190px]">
              <h3 className="font-display text-h4 uppercase tracking-wide text-maroon sm:text-h3 lg:text-h2">
                {sec.category}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-5 lg:grid-cols-3">
                {sec.products.map((p) => (
                  <ProductCardTrigger
                    key={p.id}
                    product={p}
                    ariaLabel={`Order ${p.name}`}
                    className="group flex w-full flex-col overflow-hidden rounded-xl border border-copper/15 bg-paper text-left shadow-soft transition-shadow hover:shadow-float"
                  >
                    {p.image && (
                      <div className="relative aspect-[4/3] w-full bg-cream">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="(min-width: 1024px) 33vw, 50vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-maroon text-cream shadow-md transition-colors group-hover:bg-copper group-hover:text-maroon sm:right-3 sm:top-3">
                          <Plus className="h-5 w-5" />
                        </span>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
                      <h4 className="font-display text-body uppercase leading-tight text-ink sm:text-h4">
                        {p.name}
                      </h4>
                      {priceLabel(p) && (
                        <span className="font-display text-small text-maroon">{priceLabel(p)}</span>
                      )}
                      {p.description && (
                        <p className="line-clamp-2 text-xs text-warm-gray sm:text-small">{p.description}</p>
                      )}
                      <span className="mt-auto inline-flex items-center gap-1 pt-2 font-display text-xs uppercase tracking-widest text-copper transition-colors group-hover:text-maroon">
                        <Plus className="h-4 w-4" /> Add
                      </span>
                    </div>
                  </ProductCardTrigger>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
