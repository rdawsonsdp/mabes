"use client";

import { useState } from "react";
import { Close, Instagram, Menu, Phone } from "./icons";
import { PHONE_DISPLAY, PHONE_HREF, ORDER_HREF } from "./ContactBar";

const NAV = [
  { label: "Home", href: "/", active: true },
  { label: "Menus", href: "#menus" },
  { label: "Catering", href: "#catering" },
  { label: "About", href: "#about" },
  { label: "Gift Cards", href: "#gift-cards" },
  { label: "Store", href: "#store" },
  { label: "Order Online", href: ORDER_HREF, external: true },
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
            item.label === "Order Online" ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display rounded-pill bg-copper px-5 py-2 text-base uppercase tracking-widest text-maroon transition-colors hover:bg-maroon hover:text-cream"
              >
                {item.label}
              </a>
            ) : (
              <a
                key={item.label}
                href={item.href}
                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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

      {/* mobile dropdown menu */}
      {open && (
        <nav className="flex flex-col border-t border-gray-100 bg-paper px-6 py-4 lg:hidden">
          {NAV.filter((i) => i.label !== "Order Online").map((item) => (
            <a
              key={item.label}
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={() => setOpen(false)}
              className={`font-display border-b border-gray-100 py-3 text-xl tracking-wide transition-colors hover:text-copper ${
                item.active ? "text-copper" : "text-ink"
              }`}
            >
              {item.label}
            </a>
          ))}
          <a
            href={ORDER_HREF}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="font-display mt-4 rounded-pill bg-maroon py-3 text-center text-base uppercase tracking-widest text-cream"
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
