import Image from "next/image";

// Brand logo lockup: the Mabe's sandwich mark (transparent PNG) + the
// wordmark. Shared by the site header, catering nav, and footer so the logo is
// consistent everywhere.
export function Logo({
  href = "/",
  className = "",
  wordmarkClassName = "text-ink",
}: {
  href?: string;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <a
      href={href}
      aria-label="Mabe's Sandwich Shop — home"
      className={`flex items-center gap-2.5 leading-none ${className}`}
    >
      <Image
        src="/img/mabes-sandwich-logo.png"
        alt=""
        aria-hidden
        width={275}
        height={198}
        priority
        className="h-10 w-auto sm:h-11 lg:h-12"
      />
      <span className="flex flex-col">
        <span className={`font-display text-h4 ${wordmarkClassName}`}>Mabe&apos;s</span>
        <span className="font-display text-xs tracking-[0.2em] text-copper">Sandwich Shop</span>
      </span>
    </a>
  );
}
