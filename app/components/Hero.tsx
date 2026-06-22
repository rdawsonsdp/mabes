import Image from "next/image";
import { PHONE_DISPLAY, PHONE_HREF } from "./ContactBar";
import { OpenToday } from "./OpenToday";

// Food-first hero: the sandwich is the headline. One primary action (Order
// Online), a scroll cue to the featured items, and an open-today chip for
// urgency.
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/img/menu-photo.jpg"
        alt="Grilled turkey panini stacked high at Mabe's Sandwich Shop"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 py-24 md:py-36">
        <OpenToday />

        <h1 className="font-display max-w-2xl text-h1 leading-[1.05] text-cream md:text-hero">
          Hot Off the Press, Made to Order
        </h1>
        <p className="max-w-xl text-h4 leading-snug text-cream/90">
          Jerk turkey paninis, double-decker clubs, fresh salads &amp; smoothies — made fresh the
          moment you order, right here on East 75th.
        </p>

        <div className="mt-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href="#menus"
              className="font-display rounded-pill bg-cream px-10 py-4 text-body tracking-widest text-maroon shadow-float transition-colors hover:bg-copper hover:text-cream"
            >
              Order Online
            </a>
            <a
              href="#favorites"
              className="font-display rounded-pill border border-cream/70 px-8 py-4 text-body tracking-widest text-cream transition-colors hover:border-copper hover:text-copper"
            >
              See the Favorites ↓
            </a>
            <a
              href={PHONE_HREF}
              className="font-display text-small tracking-widest text-cream underline-offset-4 hover:underline"
            >
              or call {PHONE_DISPLAY}
            </a>
          </div>
          <p className="text-small text-cream/80">
            Pickup or delivery · ready in minutes · 10% off your first online order with code
            MASAVE10
          </p>
        </div>
      </div>
    </section>
  );
}
