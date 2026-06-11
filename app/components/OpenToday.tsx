"use client";

import { useEffect, useState } from "react";

// Today's hours by JS day index — mirrors HOURS in ContactBar (Sun closed,
// Mon–Thu 9–4, Fri 9–5, Sat 10–3). Resolved in an effect so SSR and the
// client never disagree about what day it is.
const DAY_HOURS = [
  "Closed",
  "9 AM – 4 PM",
  "9 AM – 4 PM",
  "9 AM – 4 PM",
  "9 AM – 4 PM",
  "9 AM – 5 PM",
  "10 AM – 3 PM",
];

// "Open today" urgency chip for the hero.
export function OpenToday() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(DAY_HOURS[new Date().getDay()]), []);
  if (!today) return null;

  const closed = today === "Closed";
  return (
    <p className="flex w-fit items-center gap-2 rounded-pill bg-cream/15 px-4 py-1.5 text-small tracking-wide text-cream backdrop-blur">
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${closed ? "bg-copper" : "bg-olive"}`}
      />
      {closed ? (
        <>
          Closed today ·{" "}
          <a href="#visit" className="underline underline-offset-4 hover:text-copper">
            see hours
          </a>
        </>
      ) : (
        <>Open today · {today}</>
      )}
    </p>
  );
}
