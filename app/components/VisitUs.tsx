import { MapPin, Phone } from "./icons";
import {
  ADDRESS,
  EMAIL,
  HOURS,
  MAPS_HREF,
  PHONE_DISPLAY,
  PHONE_HREF,
  ORDER_HREF,
} from "./ContactBar";

// Prominent "the info people look for" block: address, phone, email, hours,
// and Order Now — placed high on the homepage.
export function VisitUs() {
  return (
    <section id="visit" className="scroll-mt-32 bg-cream py-16">
      <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-10 px-6 md:grid-cols-2">
        {/* contact */}
        <div className="flex flex-col gap-5">
          <h2 className="font-display text-h2 text-maroon">Visit Us</h2>

          <a
            href={MAPS_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 text-ink transition-colors hover:text-copper"
          >
            <MapPin className="mt-1 h-5 w-5 shrink-0 text-copper" />
            <span className="text-h4">{ADDRESS}</span>
          </a>

          <a
            href={PHONE_HREF}
            className="flex items-center gap-3 text-ink transition-colors hover:text-copper"
          >
            <Phone className="h-5 w-5 shrink-0 text-copper" />
            <span className="font-display text-h4">{PHONE_DISPLAY}</span>
          </a>

          <a
            href={`mailto:${EMAIL}`}
            className="text-ink underline-offset-4 transition-colors hover:text-copper hover:underline"
          >
            {EMAIL}
          </a>

          <a
            href={ORDER_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display mt-2 w-fit rounded-pill bg-maroon px-8 py-3 text-small tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
          >
            Order Online
          </a>
        </div>

        {/* hours */}
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-h2 text-maroon">Hours</h2>
          <dl className="divide-y divide-copper/30">
            {HOURS.map((h) => (
              <div key={h.days} className="flex items-baseline justify-between py-2.5">
                <dt className="font-display text-h4 text-ink">{h.days}</dt>
                <dd className="text-warm-gray">{h.time}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
