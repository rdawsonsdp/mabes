// Live "Open now / Closed" indicator with the hours, computed in the shop's own
// timezone (America/Chicago) so it reads the same for every visitor. Rendered
// on the server; the homepage is force-dynamic, so it reflects the request time.
//
// Schedule (minutes from midnight): Sun closed · Mon–Thu 9–4 · Fri 9–5 · Sat 10–3.
// Keep in sync with HOURS in ContactBar.
const SCHEDULE: (readonly [number, number] | null)[] = [
  null, // Sun
  [540, 960], // Mon 9:00–16:00
  [540, 960], // Tue
  [540, 960], // Wed
  [540, 960], // Thu
  [540, 1020], // Fri 9:00–17:00
  [600, 900], // Sat 10:00–15:00
];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function timeLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h < 12 ? "AM" : "PM";
  const hh = ((h + 11) % 12) + 1;
  return m ? `${hh}:${String(m).padStart(2, "0")} ${ap}` : `${hh} ${ap}`;
}

export function OpenStatus() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const dayIdx = DAY_INDEX[wd] ?? 0;
  const nowMin =
    parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10) * 60 +
    parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);

  const todays = SCHEDULE[dayIdx];
  const isOpen = todays != null && nowMin >= todays[0] && nowMin < todays[1];

  let detail: string;
  if (isOpen) {
    detail = `Open now · until ${timeLabel(todays![1])}`;
  } else {
    // Find the next opening: later today, or the next scheduled day.
    let next: { idx: number; open: number } | null = null;
    for (let i = 0; i < 7; i++) {
      const idx = (dayIdx + i) % 7;
      const s = SCHEDULE[idx];
      if (!s) continue;
      if (i === 0 && nowMin >= s[0]) continue; // already past today's open → after close
      next = { idx, open: s[0] };
      break;
    }
    if (next) {
      let dayWord = "";
      if (next.idx !== dayIdx) {
        dayWord = next.idx === (dayIdx + 1) % 7 ? "tomorrow " : `${DAY_SHORT[next.idx]} `;
      }
      detail = `Closed · opens ${dayWord}${timeLabel(next.open)}`;
    } else {
      detail = "Closed";
    }
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-pill border border-copper/30 bg-paper/70 px-3 py-1.5 text-small tracking-wide text-maroon">
      <span aria-hidden className={`h-2 w-2 rounded-full ${isOpen ? "bg-olive" : "bg-copper"}`} />
      {detail}
    </span>
  );
}
