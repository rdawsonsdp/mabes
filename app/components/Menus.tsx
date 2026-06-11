"use client";

import { useState } from "react";
import menuData from "../menu.json";
import { ORDER_HREF } from "./ContactBar";

type Item = { name: string; price?: string; desc?: string };
type Section = { title: string; note?: string; items: Item[] };
type Menu = { name: string; note?: string; sections: Section[] };

const MENUS = (menuData as { menus: Menu[] }).menus;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Menu page modeled on fatbackbutcher.com/menus: big MENUS title, menu-type
// tabs + Order Online, a category sub-nav, then a 3-column grid of items with
// big uppercase display names and descriptions below. Mabe's content + prices,
// our Baskerville + warm palette.
export function Menus() {
  const [active, setActive] = useState(0);
  const menu = MENUS[active];

  return (
    <section id="menus" className="scroll-mt-32 bg-paper py-20">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="font-display text-center text-h1 uppercase tracking-wide text-ink md:text-hero">
          Menus
        </h2>

        {/* menu-type tabs + order online — sticky so ordering stays one tap away */}
        <div className="sticky top-[88px] z-20 -mx-6 mt-8 flex flex-col items-center gap-3 bg-paper/95 px-6 py-3 backdrop-blur lg:top-[100px]">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {MENUS.map((m, i) => (
              <button
                key={m.name}
                onClick={() => setActive(i)}
                className={`font-display px-7 py-2.5 text-small uppercase tracking-widest transition-colors ${
                  i === active ? "bg-copper text-cream" : "border border-copper/50 text-copper hover:bg-cream"
                }`}
              >
                {m.name.replace(/ Menu$/, "")}
              </button>
            ))}
            <a
              href={ORDER_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display rounded-pill bg-maroon px-7 py-2.5 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
            >
              Order Online
            </a>
          </div>
        </div>

        {/* subtitle */}
        <div className="mt-12 text-center">
          <p className="font-display text-h4 uppercase tracking-wide text-copper">The Mabe&apos;s Menu</p>
          {menu.note && <p className="mt-1 text-small italic text-warm-gray">{menu.note}</p>}
        </div>

        {/* category sub-nav */}
        <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {menu.sections.map((sec, i) => (
            <span key={sec.title} className="flex items-center gap-x-6">
              {i > 0 && <span className="h-4 w-px bg-copper/40" aria-hidden />}
              <a
                href={`#cat-${slug(sec.title)}`}
                className="font-display text-small uppercase tracking-wide text-copper transition-colors hover:text-ink"
              >
                {sec.title}
              </a>
            </span>
          ))}
        </nav>

        {/* items grouped by category */}
        <div className="mt-16 space-y-16">
          {menu.sections.map((sec) => (
            <div key={sec.title} id={`cat-${slug(sec.title)}`} className="scroll-mt-32">
              <h3 className="font-display text-h2 uppercase tracking-wide text-maroon">{sec.title}</h3>
              {sec.note && <p className="mt-2 max-w-3xl text-small italic text-warm-gray">{sec.note}</p>}
              <div className="mt-8 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {sec.items.map((it) => (
                  <div key={it.name} className="flex flex-col gap-2">
                    <div className="flex items-baseline justify-between gap-3 border-b border-copper/25 pb-2">
                      <h4 className="font-display text-h3 uppercase leading-tight text-ink">{it.name}</h4>
                      {it.price && (
                        <span className="shrink-0 font-display text-small text-maroon">{it.price}</span>
                      )}
                    </div>
                    {it.desc && <p className="text-small text-warm-gray">{it.desc}</p>}
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
