"use client";

import { useEffect, useRef, useState } from "react";
import { CATERING_EMAIL } from "./ContactBar";

// Catering inquiry form. Opens whenever the URL hash is "#catering" (so every
// existing Catering / Inquire link triggers it) and submits by composing an
// email to the shop via the visitor's mail client (mailto) — no backend needed.
// To deliver server-side instead, POST these fields to /api/catering.
export function CateringModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [sent, setSent] = useState(false);

  const open = () => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  };
  const close = () => {
    dialogRef.current?.close();
    if (location.hash === "#catering") history.replaceState(null, "", location.pathname);
  };

  useEffect(() => {
    const sync = () => (location.hash === "#catering" ? open() : undefined);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) || "").trim();
    const lines = [
      `Name: ${get("name")}`,
      `Email: ${get("email")}`,
      `Phone: ${get("phone")}`,
      `Event date: ${get("date")}`,
      `Guests: ${get("guests")}`,
      "",
      "Details:",
      get("details"),
    ];
    const subject = `Catering inquiry — ${get("name") || "New request"}`;
    const href = `mailto:${CATERING_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = href;
    setSent(true);
  };

  const field =
    "w-full border border-copper/40 bg-paper px-3 py-2 text-body text-ink outline-none focus:border-copper";
  const label = "font-display text-small tracking-wide text-maroon";

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      className="m-auto w-[min(92vw,560px)] rounded-md bg-cream p-0 text-ink backdrop:bg-black/60"
    >
      <div className="max-h-[90vh] overflow-y-auto p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-h3 text-maroon">Catering Inquiry</h2>
            <p className="mt-1 text-small text-ink/70">
              From an office party to an at-home celebration — tell us about your event.
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="font-display text-h4 leading-none text-maroon hover:text-copper"
          >
            ×
          </button>
        </div>

        {sent ? (
          <div className="space-y-4 py-6 text-center">
            <p className="font-display text-h4 text-maroon">Thank you!</p>
            <p className="text-body text-ink/80">
              Your email is ready to send in your mail app. We&apos;ll be in touch soon. Prefer to
              call? <span className="font-display text-copper">(773) 891-1798</span>.
            </p>
            <button
              onClick={close}
              className="font-display rounded-pill bg-maroon px-6 py-2 text-small tracking-widest text-cream hover:bg-copper hover:text-maroon"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={label} htmlFor="name">Name *</label>
              <input id="name" name="name" required className={field} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor="email">Email *</label>
              <input id="email" name="email" type="email" required className={field} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="tel" className={field} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor="date">Event date</label>
              <input id="date" name="date" type="date" className={field} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={label} htmlFor="guests">Number of guests</label>
              <input id="guests" name="guests" type="number" min={1} className={field} />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className={label} htmlFor="details">Event details *</label>
              <textarea id="details" name="details" required rows={4} className={field} />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="font-display w-full rounded-pill bg-maroon px-6 py-3 text-small tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
              >
                Send Catering Request
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
