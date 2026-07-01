import Image from "next/image";
import { DOORDASH_HREF, UBER_EATS_HREF } from "./ContactBar";
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
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />

      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 py-24 md:py-36">
        <OpenToday />

        <h1 className="font-display max-w-2xl text-h1 leading-[1.05] text-cream md:text-hero">
          Hot Off the Press, Made to Order
        </h1>
        <p className="max-w-xl text-h4 leading-snug text-cream/90">
          Jerk turkey paninis, double-decker clubs, fresh salads &amp; smoothies — made fresh the
          moment you order, right here on East 75th.
        </p>

        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <a
              href="#menus"
              className="font-display rounded-pill bg-cream px-10 py-4 text-body tracking-widest text-maroon shadow-float transition-colors hover:bg-copper hover:text-cream"
            >
              Order Online
            </a>
            <a
              href="/catering/menu"
              className="font-display rounded-pill border border-cream/70 px-8 py-4 text-body tracking-widest text-cream transition-colors hover:border-copper hover:text-copper"
            >
              Order Catering
            </a>
          </div>

          {/* delivery partners — sit right under the Order / Cater buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-small text-cream/80">Or get it delivered:</span>
            <a
              href={UBER_EATS_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display rounded-pill bg-black px-5 py-2.5 text-small tracking-wide text-white transition-opacity hover:opacity-80"
            >
              Uber&nbsp;Eats
            </a>
            <a
              href={DOORDASH_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display rounded-pill bg-[#EB1700] px-5 py-2.5 text-small tracking-wide text-white transition-opacity hover:opacity-80"
            >
              DoorDash
            </a>
          </div>

          <p className="text-small text-cream/80">Pickup or delivery · made fresh to order</p>
        </div>
      </div>
    </section>
  );
}
