// The display heading flanked by copper horizontal rules (the "YOUR MAKER OF…" bar).
export function RuleHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-6 py-12 sm:gap-6 md:py-16">
      <span className="hidden h-px flex-1 bg-copper sm:block" />
      <h2 className="font-display text-center text-h3 italic leading-tight text-ink sm:text-h2 md:text-h1">
        {children}
      </h2>
      <span className="hidden h-px flex-1 bg-copper sm:block" />
    </div>
  );
}
