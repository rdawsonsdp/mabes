import Image from "next/image";
import { ORDER_HREF } from "./ContactBar";

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
        <div>
          <a
            href={ORDER_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display mt-2 inline-block border border-cream px-8 py-3 text-small tracking-widest text-cream transition-colors hover:bg-cream hover:text-maroon"
          >
            Order Online
          </a>
        </div>
      </div>
    </section>
  );
}
