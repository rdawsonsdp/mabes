"use client";

import { useState } from "react";

// Top promo banner with a one-tap copy of the code so it survives the jump to
// the online-ordering site.
export function PromoBar() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText("MASAVE10").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-maroon py-2.5 text-center text-small text-cream">
      Get 10% off your 1st online order of $15+ —{" "}
      <button
        onClick={copy}
        className="font-display tracking-widest text-copper underline-offset-2 transition-colors hover:text-cream hover:underline"
      >
        {copied ? "Copied! MASAVE10 ✓" : "tap to copy MASAVE10"}
      </button>
      <span className="hidden sm:inline"> · applies at checkout</span>
    </div>
  );
}
