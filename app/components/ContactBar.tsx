import { MapPin, Phone } from "./icons";
import { OpenStatus } from "./OpenStatus";

export const PHONE_DISPLAY = "(773) 891-1798";
export const PHONE_HREF = "tel:+17738911798";
export const ADDRESS = "312 E 75th St, Chicago, IL 60619";
export const EMAIL = "mabesdeli@gmail.com";
export const HOURS = [
  { days: "Monday – Thursday", time: "9 AM – 4 PM" },
  { days: "Friday", time: "9 AM – 5 PM" },
  { days: "Saturday", time: "10 AM – 3 PM" },
  { days: "Sunday", time: "Closed" },
];
export const MAPS_HREF =
  "https://www.google.com/maps/search/?api=1&query=312+E+75th+St+Chicago+IL+60619";
export const DIRECTIONS_HREF =
  "https://www.google.com/maps/dir/?api=1&destination=312+E+75th+St+Chicago+IL+60619";
export const ORDER_HREF =
  "https://www.mabesss.com/online-ordering/mabes-kitchen/menu";
export const CATERING_EMAIL = "mabesdeli@gmail.com";

// Mabe's Deli delivery-partner store pages (verified live listings).
export const UBER_EATS_HREF =
  "https://www.ubereats.com/store/mabes-deli-chicago/5roziNIKRPyw79nykZry3g";
export const DOORDASH_HREF = "https://www.doordash.com/store/mabes-deli-chicago-521982";

// Tight top contact strip: open-now/hours indicator, address → Google Maps
// (new tab), directions, and phone. Compact type so the address never runs
// onto a second line on phones.
export function ContactBar() {
  return (
    <div className="border-b border-copper/30 bg-cream">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-1.5 px-4 py-2 text-maroon sm:flex-row sm:gap-4 sm:px-6">
        {/* address + directions */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
          <a
            href={MAPS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display flex items-center gap-1.5 text-small tracking-wide transition-colors hover:text-copper sm:text-base"
          >
            <MapPin className="h-4 w-4 shrink-0 text-copper" />
            <span>{ADDRESS}</span>
          </a>
          <a
            href={DIRECTIONS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-xs tracking-widest text-copper underline-offset-4 transition-colors hover:text-maroon hover:underline"
          >
            Directions ›
          </a>
        </div>

        {/* open status + phone */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <OpenStatus />
          <a href={PHONE_HREF} className="flex items-center gap-1.5 transition-colors hover:text-copper">
            <Phone className="h-4 w-4 text-copper" />
            <span className="font-display text-small tracking-wide sm:text-base">{PHONE_DISPLAY}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
