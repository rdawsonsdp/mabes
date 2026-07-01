import Image from "next/image";
import type { Product } from "@/app/lib/types";
import { ProductCardTrigger } from "./menu/ProductCardTrigger";
import { Plus } from "./icons";

type Featured = {
  slug: string; // matches a product slug in the catalog
  name: string;
  price: string;
  desc: string;
  badge: string;
  image: string;
  alt: string;
};

// Signature items pulled from the catalog, paired with the shop's real photos.
// `slug` ties each card to its DB product so the order popup carries real
// variants/modifiers/pricing.
const FAVORITES: Featured[] = [
  {
    slug: "lunch-dj-s-jerk-turkey-panini",
    name: "DJ's Jerk Turkey Panini",
    price: "$11.00",
    badge: "Best Seller",
    desc: "Jerk turkey breast, turkey bacon, red onion, spinach, Swiss & roasted red pepper mayo — hot off the press.",
    image: "/img/food-3029.jpeg",
    alt: "Stack of grilled jerk turkey paninis at Mabe's",
  },
  {
    slug: "lunch-mabe-s-double-decker-turkey-club",
    name: "Mabe's Double Decker Turkey Club",
    price: "$11.50",
    badge: "Shop Favorite",
    desc: "Seasoned turkey breast, turkey bacon, herb mayo, lettuce, and your choice of cheese, stacked two stories high.",
    image: "/img/sandwich-2.jpg",
    alt: "Double decker turkey club quarters on skewers",
  },
  {
    slug: "lunch-turkey-cristo",
    name: "Turkey Cristo",
    price: "$17.00",
    badge: "Signature",
    desc: "Turkey breast with Swiss & American, battered and deep-fried golden, served with a side of preserves.",
    image: "/img/table-breakfast.jpg",
    alt: "Turkey Cristo wedges beside a breakfast scrambler bowl",
  },
  {
    slug: "breakfast-french-toast-breakfast-sandwich",
    name: "French Toast Breakfast Sandwich",
    price: "$15.00",
    badge: "Breakfast · till noon",
    desc: "Custard-dipped Texas toast grilled golden, with a fried egg, turkey bacon or sausage, and buttermilk syrup.",
    image: "/img/food-4984.jpg",
    alt: "Breakfast spread with french toast sandwiches and scrambler bowls",
  },
];

const CARD_CLASS =
  "group flex w-full flex-col overflow-hidden rounded-xl bg-paper text-left shadow-soft transition-shadow hover:shadow-float";

// The food, front and center: photo-led cards for the items people come back
// for. Tap anywhere on a card to open the order popup. Two-up compact grid on
// phones, up to four across on desktop.
export function FeaturedItems({ products }: { products: Product[] }) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <section id="favorites" className="relative isolate scroll-mt-32 overflow-hidden py-12 sm:py-20">
      {/* food behind the block — keeps the eye on the food */}
      <Image
        src="/img/table-breakfast.jpg"
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="-z-10 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-cream/92 via-cream/78 to-cream/92" />
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="flex flex-col items-center gap-2 text-center sm:gap-3">
          <h2 className="font-display text-h2 text-maroon sm:text-h1 md:text-hero">Connie&apos;s Favorites</h2>
          <p className="max-w-2xl text-small leading-snug text-ink/80 sm:text-h4">
            The sandwiches our regulars cross town for — made to order, every time.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 lg:grid-cols-4">
          {FAVORITES.map((item) => {
            const product = bySlug.get(item.slug);

            const inner = (
              <>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="font-display absolute left-2 top-2 rounded-pill bg-maroon px-2 py-0.5 text-[10px] uppercase tracking-widest text-cream sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs">
                    {item.badge}
                  </span>
                  <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-maroon text-cream shadow-md transition-colors group-hover:bg-copper group-hover:text-maroon sm:right-3 sm:top-3">
                    <Plus className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-body leading-tight text-ink sm:text-h4">{item.name}</h3>
                    <span className="font-display shrink-0 text-body text-copper sm:text-h4">{item.price}</span>
                  </div>
                  <p className="line-clamp-2 text-xs text-warm-gray sm:text-small">{item.desc}</p>
                </div>
              </>
            );

            return product ? (
              <ProductCardTrigger
                key={item.slug}
                product={product}
                image={item.image}
                ariaLabel={`Order ${item.name}`}
                className={CARD_CLASS}
              >
                {inner}
              </ProductCardTrigger>
            ) : (
              <a key={item.slug} href="#menus" aria-label={`See ${item.name} on the menu`} className={CARD_CLASS}>
                {inner}
              </a>
            );
          })}
        </div>

        <div className="mt-8 text-center sm:mt-10">
          <p className="text-small italic text-warm-gray">
            Make any sandwich a combo — chips and a drink for $2 more.
          </p>
        </div>
      </div>
    </section>
  );
}
