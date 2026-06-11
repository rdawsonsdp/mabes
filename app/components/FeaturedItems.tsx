import Image from "next/image";
import { ORDER_HREF } from "./ContactBar";

type Featured = {
  name: string;
  price: string;
  desc: string;
  badge: string;
  image: string;
  alt: string;
};

// Signature items pulled from menu.json, paired with the shop's real photos.
const FAVORITES: Featured[] = [
  {
    name: "DJ's Jerk Turkey Panini",
    price: "$11.00",
    badge: "Best Seller",
    desc: "Jerk turkey breast, turkey bacon, red onion, spinach, Swiss & roasted red pepper mayo — hot off the press.",
    image: "/img/food-3029.jpeg",
    alt: "Stack of grilled jerk turkey paninis at Mabe's",
  },
  {
    name: "Mabe's Double Decker Turkey Club",
    price: "$11.50",
    badge: "Shop Favorite",
    desc: "Seasoned turkey breast, turkey bacon, herb mayo, lettuce, and your choice of cheese, stacked two stories high.",
    image: "/img/sandwich-2.jpg",
    alt: "Double decker turkey club quarters on skewers",
  },
  {
    name: "Turkey Cristo",
    price: "$17.00",
    badge: "Signature",
    desc: "Turkey breast with Swiss & American, battered and deep-fried golden, served with a side of preserves.",
    image: "/img/table-breakfast.jpg",
    alt: "Turkey Cristo wedges beside a breakfast scrambler bowl",
  },
  {
    name: "French Toast Breakfast Sandwich",
    price: "$15.00",
    badge: "Breakfast · till noon",
    desc: "Custard-dipped Texas toast grilled golden, with a fried egg, turkey bacon or sausage, and buttermilk syrup.",
    image: "/img/food-4984.jpg",
    alt: "Breakfast spread with french toast sandwiches and scrambler bowls",
  },
];

// The food, front and center: photo-led cards for the items people come back
// for, each one tap from the online ordering menu.
export function FeaturedItems() {
  return (
    <section id="favorites" className="scroll-mt-32 bg-cream py-20">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="font-display text-h1 text-maroon md:text-hero">The Favorites</h2>
          <p className="max-w-2xl text-h4 leading-snug text-ink/80">
            The sandwiches our regulars cross town for — made to order, every time.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FAVORITES.map((item) => (
            <a
              key={item.name}
              href={ORDER_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col overflow-hidden bg-paper shadow-soft transition-shadow hover:shadow-float"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="font-display absolute left-3 top-3 rounded-pill bg-maroon px-3 py-1 text-xs uppercase tracking-widest text-cream">
                  {item.badge}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-h4 leading-tight text-ink">{item.name}</h3>
                  <span className="font-display shrink-0 text-h4 text-copper">{item.price}</span>
                </div>
                <p className="text-small text-warm-gray">{item.desc}</p>
                <span className="font-display mt-auto pt-2 text-small tracking-widest text-maroon transition-colors group-hover:text-copper">
                  Order This ›
                </span>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-small italic text-warm-gray">
            Make any sandwich a combo — chips and a drink for $2 more.
          </p>
          <a
            href="#menus"
            className="font-display rounded-pill border border-copper px-8 py-3 text-small tracking-widest text-copper transition-colors hover:bg-copper hover:text-cream"
          >
            Browse the Full Menu
          </a>
        </div>
      </div>
    </section>
  );
}
