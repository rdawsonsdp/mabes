// Money is stored everywhere as integer cents (Clover does the same) and only
// formatted to a "$0.00" string at the edges. Parsing tolerates the messy price
// strings in menu.json: "$9.00", "9", "Cup $5.00 · Bowl $6.50" (first match),
// ".75", "$16".

/** Pull the first dollar amount out of an arbitrary string → cents. */
export function parsePriceToCents(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const match = String(raw).match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  return dollarsToCents(match[1]);
}

/** "9.5" | "9" | ".75" → integer cents, rounded to avoid float drift. */
export function dollarsToCents(dollars: string | number): number {
  const n = typeof dollars === "number" ? dollars : parseFloat(dollars);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** 950 → "$9.50". Negative-safe. */
export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  return `${sign}$${(abs / 100).toFixed(2)}`;
}
