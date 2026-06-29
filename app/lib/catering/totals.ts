import type { Product } from "@/app/lib/types";
import type { CateringCartItem, CateringOrderItemSnapshot } from "./types";

// Canonical totals helper lives in config.ts (object-arg). Re-export so callers
// can import it alongside repriceItems from one place.
export { computeCateringTotals } from "./config";

// Server-side re-pricing: never trust the client's unitPriceCents. Recompute
// every line from catalog data (base price + authoritative modifier prices),
// exactly as the regular cart does in app/lib/cart/pricing.ts.
export function repriceItems(
  items: CateringCartItem[],
  products: Product[]
): { items: CateringOrderItemSnapshot[]; subtotalCents: number } {
  const byId = new Map(products.map((p) => [p.id, p]));
  const out: CateringOrderItemSnapshot[] = [];
  let subtotalCents = 0;

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) {
      throw new Error(`Unknown catering product: ${item.productId}`);
    }
    const modById = new Map(
      product.modifierGroups.flatMap((g) => g.modifiers.map((m) => [m.id, m] as const))
    );
    const selectedModifiers = item.selectedModifiers.map((sel) => {
      const m = modById.get(sel.modifierId);
      if (!m) throw new Error(`Invalid option for ${product.name}`);
      return { name: m.name, priceCents: m.priceCents };
    });

    // Enforce each linked modifier group's min/max against the selected count.
    for (const group of product.modifierGroups) {
      const count = item.selectedModifiers.filter((m) => m.groupId === group.id).length;
      const min = group.minSelect ?? 0;
      const max = group.maxSelect; // null = unlimited
      if (count < min || (max != null && count > max)) {
        const want = max != null && max === min ? `${min}` : max != null ? `${min}–${max}` : `${min}+`;
        throw new Error(
          `Invalid selection for "${product.name}": "${group.name}" requires ${want} option(s), got ${count}.`
        );
      }
    }

    const base = product.basePriceCents ?? 0;
    const modTotal = selectedModifiers.reduce((sum, m) => sum + m.priceCents, 0);
    const unitPriceCents = base + modTotal;
    const quantity = Math.max(1, Math.floor(item.quantity));
    const lineTotalCents = unitPriceCents * quantity;
    subtotalCents += lineTotalCents;

    out.push({
      productId: product.id,
      name: product.name,
      quantity,
      unitPriceCents,
      lineTotalCents,
      selectedModifiers,
      notes: item.notes,
    });
  }

  return { items: out, subtotalCents };
}
