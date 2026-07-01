"use client";

import Image from "next/image";
import { useState } from "react";
import type { MenuGroup, Product } from "@/app/lib/types";
import { formatCents } from "@/app/lib/money";
import { ProductCardTrigger } from "./menu/ProductCardTrigger";
import { Plus } from "./icons";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// The menu-level fallback image (breakfast spread vs. paninis).
function menuBackground(name: string): string {
  return name.toLowerCase().includes("breakfast") ? "/img/food-4984.jpg" : "/img/food-3029.jpeg";
}

// A subtle food photo behind each category, matched to its food type. Uses only
// real Mabe's photos. Categories without a specific match yet (smoothies,
// sides/drinks, soups & chili) fall back to the menu's own image.
function sectionBackground(category: string, menuName: string): string {
  const c = category.toLowerCase();
  if (c.includes("breakfast") || c.includes("french toast") || c.includes("egg")) return "/img/food-4984.jpg";
  if (c.includes("salad")) return "/img/catering/salad_bowl.jpg";
  if (c.includes("sweet") || c.includes("dessert") || c.includes("cookie") || c.includes("treat"))
    return "/img/catering/cookies.jpg";
  if (c.includes("wrap")) return "/img/catering/veggie_wrap.jpg";
  if (c.includes("sandwich") || c.includes("panini") || c.includes("club") || c.includes("sub") || c.includes("melt"))
    return "/img/food-3029.jpeg";
  if (c.includes("kid")) return "/img/sandwich-2.jpg";
  return menuBackground(menuName);
}

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
  const menu = menus[active];

  if (!menu) return null;

  return (
    <section id="menus" className="scroll-mt-32 border-t border-copper/20 bg-paper py-8 sm:py-12">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* section opens straight into the sticky control bar: menu switcher +
            cart, then the category quick-nav pills */}
        <div className="sticky top-[88px] z-20 -mx-4 space-y-2.5 border-b border-copper/10 bg-paper/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:space-y-3 sm:px-6 sm:py-3 lg:top-[100px]">
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

        {/* items grouped by category — each on a subtle food backdrop matched
            to the category's food type */}
        <div className="mt-8 space-y-8 sm:mt-12 sm:space-y-10">
          {menu.categories.map((sec) => {
            const secBg = sectionBackground(sec.category, menu.menu);
            return (
              <div key={sec.category} id={`cat-${slug(sec.category)}`} className="scroll-mt-[190px]">
                <div className="relative isolate overflow-hidden rounded-2xl border border-copper/10 px-3 py-5 sm:px-5 sm:py-6">
                  <Image
                    key={secBg}
                    src={secBg}
                    alt=""
                    aria-hidden
                    fill
                    sizes="100vw"
                    className="-z-10 object-cover"
                  />
                  <div aria-hidden className="absolute inset-0 -z-10 bg-paper/88" />
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
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
