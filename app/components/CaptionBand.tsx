import Image from "next/image";

// Full-bleed food photo with a centered cream caption box (the homepage
// carousel slides). Static render of one slide per band; arrows/dots are
// decorative to mirror the source's UIkit slideshow chrome.
export function CaptionBand({
  image,
  alt,
  caption,
  subcaption,
}: {
  image: string;
  alt: string;
  caption: React.ReactNode;
  subcaption?: React.ReactNode;
}) {
  return (
    <section className="relative isolate flex min-h-[560px] items-center justify-center overflow-hidden">
      <Image src={image} alt={alt} fill sizes="100vw" className="-z-10 object-cover" />
      <div className="absolute inset-0 -z-10 bg-black/10" />

      <div className="mx-6 max-w-2xl bg-cream/90 px-10 py-8 text-center shadow-float">
        <p className="font-display text-h4 leading-snug text-maroon md:text-h3">{caption}</p>
        {subcaption && <div className="mt-3 text-small text-ink/80">{subcaption}</div>}
      </div>

      {/* slideshow chrome (decorative) */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-maroon/80 px-4 py-2 text-cream">
        <span aria-hidden>‹</span>
        <span className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((d) => (
            <span
              key={d}
              className={`h-1.5 w-1.5 rounded-full ${d === 0 ? "bg-cream" : "bg-cream/40"}`}
            />
          ))}
        </span>
        <span aria-hidden>›</span>
      </div>
    </section>
  );
}
