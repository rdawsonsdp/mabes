import { Instagram, Phone } from "./icons";
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
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-[100px] max-w-[1280px] items-center gap-6 px-6">
        {/* wordmark */}
        <a href="/" className="flex flex-col leading-none">
          <span className="font-display text-h4 text-ink">Mabe&apos;s</span>
          <span className="font-display text-xs tracking-[0.2em] text-copper">
            Sandwich Shop
          </span>
        </a>

        <nav className="flex flex-1 flex-wrap items-center justify-end gap-5 md:gap-8">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`font-display text-[15px] tracking-wide transition-colors hover:text-copper ${
                item.active ? "squiggle text-copper" : "text-ink"
              }`}
            >
              {item.label}
            </a>
          ))}
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
            <span className="hidden lg:inline">{PHONE_DISPLAY}</span>
            <span className="lg:hidden">Call</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
