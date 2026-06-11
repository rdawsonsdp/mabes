import { Phone } from "./icons";
import { ORDER_HREF, PHONE_HREF } from "./ContactBar";

// Always-reachable order CTA on mobile — keeps the primary conversion one tap
// away while scrolling. Hidden on desktop (the in-menu sticky bar covers that).
export function StickyOrderBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex gap-2 border-t border-copper/30 bg-paper/95 p-3 backdrop-blur lg:hidden">
      <a
        href={ORDER_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="font-display flex-1 rounded-pill bg-maroon py-3 text-center text-small tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
      >
        Order Online
      </a>
      <a
        href={PHONE_HREF}
        aria-label="Call"
        className="font-display inline-flex items-center justify-center gap-2 rounded-pill border border-copper px-6 text-small tracking-widest text-copper"
      >
        <Phone className="h-4 w-4" /> Call
      </a>
    </div>
  );
}
