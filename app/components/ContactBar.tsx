import { MapPin, Phone } from "./icons";

export const PHONE_DISPLAY = "(773) 891-1798";
export const PHONE_HREF = "tel:+17738911798";
export const ADDRESS = "312 E 75th St, Chicago, IL 60619";
export const MAPS_HREF =
  "https://www.google.com/maps/search/?api=1&query=312+E+75th+St+Chicago+IL+60619";
export const DIRECTIONS_HREF =
  "https://www.google.com/maps/dir/?api=1&destination=312+E+75th+St+Chicago+IL+60619";
export const ORDER_HREF =
  "https://www.mabesss.com/online-ordering/mabes-kitchen/menu";
// TODO: confirm the real catering inbox — Mabe's routes catering via a 3rd-party platform.
export const CATERING_EMAIL = "catering@mabesss.com";

// Prominent top contact strip: address → Google Maps (new tab), directions, phone, Call button.
export function ContactBar() {
  return (
    <div className="border-b border-copper/30 bg-cream">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 px-6 py-3 text-maroon sm:flex-row">
        <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-4">
          <a
            href={MAPS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display flex items-center gap-2 text-h4 tracking-wide transition-colors hover:text-copper"
          >
            <MapPin className="h-5 w-5 shrink-0 text-copper" />
            <span>{ADDRESS}</span>
          </a>
          <a
            href={DIRECTIONS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-small tracking-widest text-copper underline-offset-4 transition-colors hover:text-maroon hover:underline"
          >
            Directions ›
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            href={PHONE_HREF}
            className="hidden items-center gap-2 transition-colors hover:text-copper sm:flex"
          >
            <Phone className="h-5 w-5 text-copper" />
            <span className="font-display text-h4 tracking-wide">{PHONE_DISPLAY}</span>
          </a>
          <a
            href={PHONE_HREF}
            className="font-display inline-flex items-center gap-2 rounded-pill bg-maroon px-5 py-2.5 text-small tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
          >
            <Phone className="h-4 w-4" />
            Call Now
          </a>
        </div>
      </div>
    </div>
  );
}
