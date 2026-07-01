// mabes/app/components/catering/FulfillmentBar.tsx
"use client";

import { useMemo, useState } from "react";
import { useCateringCart } from "./CateringCartProvider";
import { earliestEventDate } from "@/app/lib/catering/config";
import { validateLeadTime } from "@/app/lib/catering/validation";
import { ADDRESS } from "@/app/components/ContactBar";
import type { FulfillmentType } from "@/app/lib/catering/types";

export function FulfillmentBar() {
  const { state, setFulfillment, setEvent } = useCateringCart();
  const minDate = useMemo(() => earliestEventDate(), []);
  const lead = validateLeadTime(state.eventDate);
  const [open, setOpen] = useState(false);

  const tabs: { type: FulfillmentType; label: string }[] = [
    { type: "pickup", label: "Pickup" },
    { type: "delivery", label: "Delivery" },
  ];

  return (
    <section
      aria-label="Fulfillment and event details"
      className="sticky top-0 z-30 border-b border-copper/20 bg-paper/95 px-4 py-2.5 backdrop-blur sm:py-3"
    >
      {/* compact summary (mobile only) */}
      <div className="mx-auto flex max-w-5xl items-center justify-between sm:hidden">
        <p className="text-small text-ink">
          <span className="font-display capitalize text-maroon">{state.fulfillmentType}</span>
          <span className="text-warm-gray"> · {state.eventDate || "add event date"}</span>
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="font-display text-small text-copper underline underline-offset-4 hover:text-maroon"
        >
          {open ? "Done" : "Change"}
        </button>
      </div>

      {/* full controls: collapsed on mobile until "Change", always shown on desktop */}
      <div className={`${open ? "mt-3 block" : "hidden"} sm:mt-0 sm:block`}>
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {/* pickup / delivery toggle */}
        <div>
          <span className="font-display block text-xs uppercase tracking-widest text-copper">
            How would you like it?
          </span>
          <div
            role="tablist"
            aria-label="Fulfillment type"
            className="mt-1 inline-flex rounded-pill border border-copper/40 p-1"
          >
            {tabs.map((t) => {
              const active = state.fulfillmentType === t.type;
              return (
                <button
                  key={t.type}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFulfillment(t.type)}
                  className={`font-display rounded-pill px-5 py-1.5 text-small uppercase tracking-widest transition-colors ${
                    active ? "bg-maroon text-cream" : "text-warm-gray hover:text-maroon"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-warm-gray">
            {state.fulfillmentType === "pickup"
              ? `Pickup at ${ADDRESS}`
              : "Delivery fee added at checkout (based on order size)."}
          </p>
        </div>

        {/* event date + time */}
        <div className="flex gap-3">
          <div>
            <label
              htmlFor="event-date"
              className="font-display block text-xs uppercase tracking-widest text-copper"
            >
              Event date
            </label>
            <input
              id="event-date"
              type="date"
              min={minDate}
              value={state.eventDate ?? ""}
              onChange={(e) => setEvent(e.target.value || null, state.eventTime)}
              className="mt-1 rounded-lg border border-copper/30 bg-paper px-3 py-2 text-small text-ink outline-none focus:border-copper"
            />
          </div>
          <div>
            <label
              htmlFor="event-time"
              className="font-display block text-xs uppercase tracking-widest text-copper"
            >
              Time
            </label>
            <input
              id="event-time"
              type="time"
              value={state.eventTime ?? ""}
              onChange={(e) => setEvent(state.eventDate, e.target.value || null)}
              className="mt-1 rounded-lg border border-copper/30 bg-paper px-3 py-2 text-small text-ink outline-none focus:border-copper"
            />
          </div>
        </div>
      </div>
      </div>

      {state.eventDate && !lead.ok && (
        <p role="alert" className="mx-auto mt-2 max-w-5xl text-small text-maroon">
          {lead.message}
        </p>
      )}
    </section>
  );
}
