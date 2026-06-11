// The display heading flanked by copper horizontal rules (the "YOUR MAKER OF…" bar).
export function RuleHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-[1280px] items-center gap-6 px-6 py-12">
      <span className="h-px flex-1 bg-copper" />
      <h2 className="font-display text-center text-h4 text-ink md:text-h3">{children}</h2>
      <span className="h-px flex-1 bg-copper" />
    </div>
  );
}
