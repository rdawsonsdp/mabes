import Image from "next/image";

// Secondary conversions (catering, gift cards) as photo cards — replaces the
// old text-only feature columns so every section on the page leads with food.
// Only Mabe's own photos here: the leftover stock shots in /img carry other
// brands (Fatback, Fifty/50) and pork items the shop doesn't serve.
export function MoreFromMabes() {
  return (
    <section className="bg-paper py-20">
      <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-8 px-6 sm:grid-cols-2">
        <a
          href="#catering"
          className="group relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden p-8"
        >
          <Image
            src="/img/food-3029.jpeg"
            alt="Tray stacked with grilled paninis for catering"
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="-z-10 object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
          <h3 className="font-display text-h2 text-cream">Catering</h3>
          <p className="mt-2 max-w-sm text-small text-cream/85">
            From an office party to an at-home celebration — sandwich trays, salads, and sweets
            for your next event.
          </p>
          <span className="font-display mt-4 w-fit rounded-pill bg-cream px-6 py-2.5 text-small tracking-widest text-maroon transition-colors group-hover:bg-copper group-hover:text-cream">
            Plan Your Event
          </span>
        </a>

        <a
          href="#gift-cards"
          className="group relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden bg-maroon p-8"
        >
          <span
            aria-hidden
            className="font-display absolute -right-6 -top-10 text-[10rem] leading-none text-cream/10"
          >
            M
          </span>
          <h3 className="font-display text-h2 text-cream">Gift Cards</h3>
          <p className="mt-2 max-w-sm text-small text-cream/85">
            Freshness is the gift that keeps on giving. Treat someone to their next favorite
            sandwich.
          </p>
          <span className="font-display mt-4 w-fit rounded-pill bg-cream px-6 py-2.5 text-small tracking-widest text-maroon transition-colors group-hover:bg-copper group-hover:text-cream">
            Buy Gift Cards
          </span>
        </a>
      </div>
    </section>
  );
}
