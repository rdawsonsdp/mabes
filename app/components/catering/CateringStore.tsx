"use client";

import { useState } from "react";
import type { MenuGroup, Product } from "@/app/lib/types";
import { formatCents } from "@/app/lib/money";
import { Bag } from "@/app/components/icons";
import { Footer } from "@/app/components/Footer";
import { useCateringCart } from "./CateringCartProvider";
import { FulfillmentBar } from "./FulfillmentBar";
import { CategoryTabs } from "./CategoryTabs";
import { CateringItemCard } from "./CateringItemCard";
import { CateringItemModal } from "./CateringItemModal";
import { CateringCartDrawer } from "./CateringCartDrawer";

export function CateringStore({ menus }: { menus: MenuGroup[] }) {
  // All catering items live under one menu ("catering"); its categories are the
  // four sections. Flatten defensively in case future data spans >1 menu.
  const categories = menus.flatMap((m) => m.categories);
  const categoryNames = categories.map((c) => c.category);
  const [active, setActive] = useState<string>(categoryNames[0] ?? "");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  const { state, openCart } = useCateringCart();
  const activeProducts = categories.find((c) => c.category === active)?.products ?? [];

  return (
    <div className="min-h-screen bg-cream">
      <header
        className="relative overflow-hidden bg-maroon px-4 py-16 text-cream"
        style={{
          backgroundImage:
            "linear-gradient(rgba(123,37,37,0.80), rgba(45,36,36,0.82)), url('/img/catering/catering-hero.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative mx-auto max-w-5xl">
          <p className="font-display text-xs uppercase tracking-widest text-cream/80">Mabe&apos;s Catering</p>
          <h1 className="font-display text-h1 leading-tight drop-shadow-sm">Build Your Catering Order</h1>
          <p className="mt-2 max-w-2xl text-small text-cream/90">
            Order minimum $60 · 2 days&apos; notice · pickup or delivery.
          </p>
        </div>
      </header>

      {/* Featured special: Boxed Lunches (per person, 10-guest minimum) */}
      {categoryNames.includes("Boxed Lunches") && (
        <section className="border-b border-copper/20 bg-copper/10 px-4 py-4">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-xs uppercase tracking-widest text-copper">
                ★ Featured · the easiest way to cater
              </p>
              <p className="font-display text-h4 leading-tight text-ink">
                Boxed Lunches — per person, 10-guest minimum
              </p>
              <p className="mt-0.5 text-small text-warm-gray">
                Individually boxed meals with chips. Perfect for meetings &amp; events.
              </p>
            </div>
            <button
              onClick={() => setActive("Boxed Lunches")}
              className="font-display shrink-0 rounded-pill bg-maroon px-6 py-3 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
            >
              Shop Boxed Lunches
            </button>
          </div>
        </section>
      )}

      <FulfillmentBar />

      {categoryNames.length > 0 && (
        <CategoryTabs categories={categoryNames} active={active} onSelect={setActive} />
      )}

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6">
        <h2 className="font-display text-h3 text-ink">{active}</h2>
        {activeProducts.length === 0 ? (
          <p className="mt-4 text-warm-gray">Nothing here yet — check back soon.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activeProducts.map((p) => (
              <CateringItemCard key={p.id} product={p} onSelect={setModalProduct} />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* floating view-order button */}
      {state.itemCount > 0 && (
        <button
          onClick={openCart}
          className="font-display fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-pill bg-maroon px-6 py-3.5 text-small uppercase tracking-widest text-cream shadow-float transition-colors hover:bg-copper hover:text-maroon"
        >
          <Bag className="h-5 w-5" />
          View order · {state.itemCount} {state.itemCount === 1 ? "item" : "items"} · {formatCents(state.subtotalCents)}
        </button>
      )}

      {modalProduct && (
        <CateringItemModal product={modalProduct} onClose={() => setModalProduct(null)} />
      )}
      <CateringCartDrawer />
    </div>
  );
}
