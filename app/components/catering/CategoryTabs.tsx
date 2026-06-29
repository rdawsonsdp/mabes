"use client";

export function CategoryTabs({
  categories,
  active,
  onSelect,
}: {
  categories: string[];
  active: string;
  onSelect: (c: string) => void;
}) {
  return (
    <nav
      aria-label="Catering categories"
      className="sticky top-[84px] z-20 -mx-4 overflow-x-auto border-b border-copper/15 bg-cream/80 px-4 py-2 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-5xl gap-2">
        {categories.map((c) => {
          const isActive = c === active;
          return (
            <li key={c}>
              <button
                aria-current={isActive ? "true" : undefined}
                onClick={() => onSelect(c)}
                className={`font-display whitespace-nowrap rounded-pill px-4 py-2 text-small uppercase tracking-widest transition-colors ${
                  isActive
                    ? "bg-maroon text-cream"
                    : "border border-copper/40 text-warm-gray hover:text-maroon"
                }`}
              >
                {c}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
