"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Close } from "./icons";

// VIP-list capture popup. Appears once the visitor scrolls ~1/3 down the page,
// shows a mouth-watering sandwich + "Eat Well!", and saves name/email/consent
// to the customers table via /api/vip. Shows at most once per visitor
// (localStorage), so it never nags.

const STORAGE_KEY = "mabes_vip_seen";
const SCROLL_TRIGGER = 0.33; // a third of the way down

type Status = "idle" | "busy" | "done" | "error";

export function VipPopup() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return; // already seen — don't nag
    } catch {
      /* localStorage blocked — fall through and show once this session */
    }

    const onScroll = () => {
      if (triggered.current) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      if (pct >= SCROLL_TRIGGER) {
        triggered.current = true;
        window.removeEventListener("scroll", onScroll);
        setVisible(true);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function markSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function close() {
    markSeen();
    setVisible(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("busy");
    setError(null);
    try {
      const res = await fetch("/api/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, consent }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
      markSeen();
      setTimeout(() => setVisible(false), 2600);
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Join the Mabe's VIP list"
    >
      <button aria-label="Close" onClick={close} className="absolute inset-0 bg-ink/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl bg-paper shadow-float sm:rounded-2xl">
        {/* appetite shot + headline */}
        <div className="relative aspect-[16/9] w-full">
          <Image
            src="/img/food-3029.jpeg"
            alt="A stack of Mabe's grilled jerk turkey paninis"
            fill
            sizes="(max-width: 640px) 100vw, 28rem"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
          <button
            onClick={close}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-ink shadow-md transition-colors hover:bg-cream"
          >
            <Close className="h-5 w-5" />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="font-display text-xs uppercase tracking-[0.2em] text-cream/85">Mabe&apos;s VIP List</p>
            <h2 className="font-display text-hero leading-none text-cream drop-shadow">Eat Well!</h2>
          </div>
        </div>

        {status === "done" ? (
          <div className="px-6 py-8 text-center">
            <p className="font-display text-h3 text-maroon">You&apos;re in! 🎉</p>
            <p className="mt-2 text-small text-warm-gray">
              Eat well — we&apos;ll send first dibs on specials and catering deals your way.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3 px-6 py-5">
            <p className="text-small text-warm-gray">
              First dibs on specials, catering deals, and a treat on your birthday. Join the list:
            </p>

            <div>
              <label htmlFor="vip-name" className="sr-only">
                Name
              </label>
              <input
                id="vip-name"
                type="text"
                autoComplete="name"
                placeholder="First name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-copper/30 bg-paper px-3 py-2.5 text-body text-ink outline-none placeholder:text-warm-gray/70 focus:border-copper"
              />
            </div>

            <div>
              <label htmlFor="vip-email" className="sr-only">
                Email
              </label>
              <input
                id="vip-email"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-copper/30 bg-paper px-3 py-2.5 text-body text-ink outline-none placeholder:text-warm-gray/70 focus:border-copper"
              />
            </div>

            <div>
              <label htmlFor="vip-phone" className="sr-only">
                Mobile phone (optional)
              </label>
              <input
                id="vip-phone"
                type="tel"
                autoComplete="tel"
                placeholder="Mobile phone (optional, for texts)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-copper/30 bg-paper px-3 py-2.5 text-body text-ink outline-none placeholder:text-warm-gray/70 focus:border-copper"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-2 text-xs text-warm-gray">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 accent-maroon"
              />
              <span>
                Yes, send me Mabe&apos;s offers &amp; updates by email and text. I can unsubscribe anytime.
              </span>
            </label>

            {error && <p className="text-small text-maroon">{error}</p>}

            <button
              type="submit"
              disabled={status === "busy"}
              className="font-display w-full rounded-pill bg-maroon py-3 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon disabled:opacity-60"
            >
              {status === "busy" ? "Joining…" : "Count Me In"}
            </button>

            <button
              type="button"
              onClick={close}
              className="w-full text-center text-xs text-warm-gray underline underline-offset-4 hover:text-ink"
            >
              No thanks
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
