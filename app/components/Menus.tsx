import menu from "../menu.json";
import { ORDER_HREF } from "./ContactBar";

type Item = { name: string; desc?: string; price?: string };
type Section = { title: string; items: Item[] };

// Mabe's menu (data from mabesss.com/menus) rendered in the cloned site's style.
export function Menus() {
  const sections = menu as Section[];
  return (
    <section id="menus" className="scroll-mt-32 bg-paper py-20">
      <div className="mx-auto max-w-[1080px] px-6">
        <div className="mb-12 flex flex-col items-center gap-3 text-center">
          <h2 className="font-display text-h2 text-ink">Our Menus</h2>
          <p className="max-w-xl text-warm-gray">
            Made-to-order sandwiches, salads, smoothies and more — served fresh daily.
          </p>
          <a
            href={ORDER_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display mt-2 rounded-pill bg-maroon px-6 py-2.5 text-small tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
          >
            Order Online
          </a>
        </div>

        <div className="space-y-12">
          {sections.map((sec) => (
            <div key={sec.title}>
              <h3 className="font-display mb-5 border-b border-copper/40 pb-2 text-h3 text-copper">
                {sec.title}
              </h3>
              <div className="grid gap-x-12 gap-y-5 sm:grid-cols-2">
                {sec.items.map((it) => (
                  <div key={it.name} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-h4 text-ink">{it.name.trim()}</span>
                      {it.price && it.price !== "Bowl" && (
                        <span className="text-warm-gray">{it.price}</span>
                      )}
                    </div>
                    {it.desc && <p className="text-small text-warm-gray">{it.desc}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
