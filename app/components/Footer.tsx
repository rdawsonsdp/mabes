import Image from "next/image";
import { Instagram } from "./icons";

const COL_A = ["Hours & Location", "Menus", "Catering", "About"];
const COL_B = ["We're Hiring", "Contact", "Gift Cards", "Store"];

export function Footer() {
  return (
    <footer className="bg-paper">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-[1.1fr_1.4fr_1fr]">
        {/* logo badge */}
        <div className="flex items-start">
          <Image
            src="/img/mabes-logo.png"
            alt="Mabe's Sandwich Shop"
            width={300}
            height={300}
            className="w-44 rounded-md shadow-soft"
          />
        </div>

        {/* link columns */}
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-small">
            <ul className="space-y-3">
              {COL_A.map((l) => (
                <li key={l}>
                  <a href="#" className="text-warm-gray transition-colors hover:text-ink">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
            <ul className="space-y-3">
              {COL_B.map((l) => (
                <li key={l}>
                  <a href="#" className="text-warm-gray transition-colors hover:text-ink">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-3 text-small font-semibold text-ink">
            <a href="#menus" className="hover:text-copper">
              Order Online
            </a>
            <a href="#catering" className="hover:text-copper">Inquire About Catering</a>
          </div>
        </div>

        {/* brand + address */}
        <div className="flex flex-col gap-5">
          <p className="font-display text-h3 text-copper">Mabe&apos;s Sandwich Shop</p>
          <address className="space-y-0.5 not-italic text-warm-gray">
            <p>312 E 75th St</p>
            <p>Chicago, IL 60619</p>
            <p>Call (773) 891-1798</p>
            <p>Our love language is freshness</p>
          </address>
          <div className="flex flex-col gap-3">
            <p className="font-display text-h4 text-ink">Stay Connected</p>
            <div className="flex items-center gap-4 text-copper">
              <a href="#" aria-label="Instagram" className="hover:text-maroon">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="bg-maroon py-6 text-center text-xs text-cream/80">
        <p>© 2026 Mabe&apos;s Sandwich Shop. All Rights Reserved.</p>
        <p className="mt-1">
          Made to order, served fresh daily · Chicago, IL
        </p>
      </div>
    </footer>
  );
}
