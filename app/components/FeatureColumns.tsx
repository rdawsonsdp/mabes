import { ORDER_HREF } from "./ContactBar";

type Feature = { heading: string; body: string; cta?: string; href?: string; external?: boolean };

const FEATURES: Feature[] = [
  {
    heading: "Our Food",
    body: "We offer a wide variety using the best ingredients — made-to-order sandwiches, salads, and smoothies served fresh daily.",
    cta: "Order Online",
    href: ORDER_HREF,
    external: true,
  },
  {
    heading: "Catering",
    body: "From an office party to an at-home celebration, we can help with your next event.",
    cta: "Inquire Now",
    href: "#catering",
  },
  {
    heading: "Gift Cards",
    body: "Freshness is the gift that keeps on giving. Treat someone to their next favorite sandwich.",
    cta: "Buy Gift Cards",
    href: "#gift-cards",
  },
  {
    heading: "About",
    body: "Our menu is inspired by our family, our love for Chicago, and our love for food.",
    cta: "Our Story",
    href: "#about",
  },
  {
    heading: "Store",
    body: "Take a little piece of the shop home with you — Mabe's merch and pantry favorites.",
    cta: "Shop Now",
    href: "#store",
  },
];

export function FeatureColumns() {
  return (
    <section className="bg-paper py-20">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-y-12 px-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.heading}
            className="flex flex-col gap-4 border-copper/40 px-0 sm:px-8 sm:[&:not(:nth-child(2n+1))]:border-l lg:[&:not(:nth-child(3n+1))]:border-l"
          >
            <h3 className="font-display text-h3 text-copper">{f.heading}</h3>
            <p className="max-w-xs text-warm-gray">{f.body}</p>
            {f.cta && (
              <a
                href={f.href || "#"}
                {...(f.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="font-display mt-2 text-small tracking-widest text-copper transition-colors hover:text-maroon"
              >
                {f.cta}
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
