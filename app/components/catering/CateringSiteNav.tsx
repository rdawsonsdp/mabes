"use client";

import { useState } from "react";
import { Close, Instagram, Menu, Phone } from "@/app/components/icons";
import { DOORDASH_HREF, PHONE_HREF, UBER_EATS_HREF } from "@/app/components/ContactBar";

// Site navigation for the catering pages. Mirrors the main site Header so
// navigation stays consistent, but without the regular CartButton (the
// catering flow has its own cart). Kept dependency-free so it renders on
// catering routes, which use the catering cart context rather than the
// regular <CartProvider>.

type NavItem = { label: string; href: string; active?: boolean; cta?: boolean };

const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Menus", href: "/#menus" },
  { label: "Catering", href: "/catering/menu", active: true },
  { label: "About", href: "/#about" },
  { label: "Order Online", href: "/#menus", cta: true },
];

export function CateringSiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-gray-100 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6 lg:h-20">
        {/* wordmark */}
        <a href="/" className="flex flex-col leading-none">
          <span className="font-display text-h4 text-ink">Mabe&apos;s</span>
          <span className="font-display text-xs tracking-[0.2em] text-copper">Sandwich Shop</span>
        </a>

        {/* desktop nav */}
        <nav className="hidden flex-1 items-center justify-end gap-5 xl:gap-7 lg:flex">
          {NAV.map((item) =>
            item.cta ? (
              <a
                key={item.label}
                href={item.href}
                className="font-display rounded-pill bg-copper px-5 py-2 text-base uppercase tracking-widest text-maroon transition-colors hover:bg-maroon hover:text-cream"
              >
                {item.label}
              </a>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className={`font-display text-lg tracking-wide transition-colors hover:text-copper xl:text-xl ${
                  item.active ? "squiggle text-copper" : "text-ink"
                }`}
              >
                {item.label}
              </a>
            )
          )}
          <a
            href={UBER_EATS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display rounded-pill bg-black px-3 py-1.5 text-xs tracking-wide text-white transition-opacity hover:opacity-80"
          >
            Uber&nbsp;Eats
          </a>
          <a
            href={DOORDASH_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display rounded-pill bg-[#EB1700] px-3 py-1.5 text-xs tracking-wide text-white transition-opacity hover:opacity-80"
          >
            DoorDash
          </a>
          <a
            href="#instagram"
            aria-label="Instagram"
            className="text-copper transition-colors hover:text-maroon"
          >
            <Instagram className="h-[18px] w-[18px]" />
          </a>
        </nav>

        {/* mobile: call + hamburger */}
        <div className="flex items-center gap-3 lg:hidden">
          <a
            href={PHONE_HREF}
            aria-label="Call"
            className="inline-flex items-center gap-2 rounded-pill bg-maroon px-4 py-2 text-cream"
          >
            <Phone className="h-4 w-4" />
            <span className="font-display text-small tracking-widest">Call</span>
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="p-1 text-ink transition-colors hover:text-copper"
          >
            {open ? <Close className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </div>

      {/* mobile dropdown */}
      {open && (
        <nav className="flex flex-col border-t border-gray-100 bg-paper px-4 py-4 sm:px-6 lg:hidden">
          {NAV.filter((i) => !i.cta).map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`font-display border-b border-gray-100 py-3 text-xl tracking-wide transition-colors hover:text-copper ${
                item.active ? "text-copper" : "text-ink"
              }`}
            >
              {item.label}
            </a>
          ))}
          <a
            href="/#menus"
            onClick={() => setOpen(false)}
            className="font-display mt-4 rounded-pill bg-copper py-3 text-center text-base uppercase tracking-widest text-maroon"
          >
            Order Online
          </a>
          <div className="mt-3 flex gap-2">
            <a
              href={UBER_EATS_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display flex-1 rounded-pill bg-black py-2.5 text-center text-small tracking-wide text-white"
            >
              Uber Eats
            </a>
            <a
              href={DOORDASH_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display flex-1 rounded-pill bg-[#EB1700] py-2.5 text-center text-small tracking-wide text-white"
            >
              DoorDash
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
