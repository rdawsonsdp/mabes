"use client";

import { useState } from "react";
import { Close, Instagram, Menu, Phone } from "./icons";
import { PHONE_DISPLAY, PHONE_HREF } from "./ContactBar";
import { CartButton } from "./cart/CartButton";

type NavItem = {
  label: string;
  href: string;
  active?: boolean;
  cta?: boolean;
  variant?: "catering";
};

const NAV: NavItem[] = [
  { label: "Home", href: "/", active: true },
  { label: "Menus", href: "#menus" },
  { label: "Catering", href: "/catering/menu" },
  { label: "About", href: "#about" },
  { label: "Order Catering", href: "/catering/menu", cta: true, variant: "catering" },
  { label: "Order Online", href: "#menus", cta: true },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-[88px] max-w-[1280px] items-center justify-between gap-6 px-6 lg:h-[100px]">
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
                className={`font-display rounded-pill px-5 py-2 text-base uppercase tracking-widest transition-colors ${
                  item.variant === "catering"
                    ? "bg-maroon text-cream hover:bg-copper hover:text-maroon"
                    : "bg-copper text-maroon hover:bg-maroon hover:text-cream"
                }`}
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
            href="#instagram"
            aria-label="Instagram"
            className="text-copper transition-colors hover:text-maroon"
          >
            <Instagram className="h-[18px] w-[18px]" />
          </a>
          <a
            href={PHONE_HREF}
            className="font-display inline-flex items-center gap-2 rounded-pill bg-maroon px-4 py-2 text-small tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
          >
            <Phone className="h-4 w-4" />
            <span>{PHONE_DISPLAY}</span>
          </a>
          <CartButton className="ml-1" />
        </nav>

        {/* mobile: cart + call + hamburger */}
        <div className="flex items-center gap-3 lg:hidden">
          <CartButton />
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

      {/* mobile dropdown menu */}
      {open && (
        <nav className="flex flex-col border-t border-gray-100 bg-paper px-6 py-4 lg:hidden">
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
            href="/catering/menu"
            onClick={() => setOpen(false)}
            className="font-display mt-4 rounded-pill bg-maroon py-3 text-center text-base uppercase tracking-widest text-cream"
          >
            Order Catering
          </a>
          <a
            href="#menus"
            onClick={() => setOpen(false)}
            className="font-display mt-2 rounded-pill bg-copper py-3 text-center text-base uppercase tracking-widest text-maroon"
          >
            Order Online
          </a>
          <a
            href="#instagram"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex items-center gap-2 text-copper"
          >
            <Instagram className="h-5 w-5" /> <span className="font-display">Follow us</span>
          </a>
        </nav>
      )}
    </header>
  );
}
