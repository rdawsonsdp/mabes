import Image from "next/image";
import { ORDER_HREF, PHONE_DISPLAY, PHONE_HREF } from "./ContactBar";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/img/food-4984.jpg"
        alt="Made-to-order sandwich at Mabe's Sandwich Shop"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />

      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 py-28 md:py-40">
        <h1 className="font-display max-w-2xl text-h1 leading-[1.05] text-cream md:text-hero">
          Welcome to Mabe&apos;s Sandwich Shop
        </h1>
        <div className="max-w-xl space-y-5 text-cream/90">
          <p>
            Our menu is inspired by our family, our love for Chicago, and our love for food.
          </p>
          <p>
            Made-to-order sandwiches, salads, and smoothies served fresh daily — your neighborhood
            sandwich shop on East 75th Street.
          </p>
        </div>
        <div className="mt-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={ORDER_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display rounded-pill bg-cream px-10 py-4 text-body tracking-widest text-maroon shadow-float transition-colors hover:bg-copper hover:text-cream"
            >
              Order Online
            </a>
            <a
              href={PHONE_HREF}
              className="font-display text-small tracking-widest text-cream underline-offset-4 hover:underline"
            >
              or call {PHONE_DISPLAY}
            </a>
          </div>
          <p className="text-small text-cream/80">Pickup or delivery — opens our online ordering</p>
        </div>
      </div>
    </section>
  );
}
