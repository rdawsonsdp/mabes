import type { Product, ProductVariant, Modifier } from "../types";
import { UserError } from "./errors";

// Resolves and validates an add-to-cart selection against a product's real
// variants/modifier rules, then prices it. Runs on the server so the client can
// never spoof a price — the unit price is always recomputed from catalog data.

export type ResolvedSelection = {
  variant: ProductVariant | null;
  modifiers: Modifier[];
  unitPriceCents: number;
};

// Validation messages are safe to show the customer.
export class SelectionError extends UserError {}

export function resolveSelection(
  product: Product,
  variantId: string | null,
  modifierIds: string[]
): ResolvedSelection {
  // ----- variant -----
  let variant: ProductVariant | null = null;
  if (product.variants.length > 0) {
    variant =
      product.variants.find((v) => v.id === variantId) ??
      product.variants.find((v) => v.isDefault) ??
      product.variants[0];
    if (variantId && !product.variants.some((v) => v.id === variantId)) {
      throw new SelectionError("That size is not available for this item.");
    }
  } else if (variantId) {
    throw new SelectionError("This item does not have sizes.");
  }

  // ----- modifiers -----
  const wanted = new Set(modifierIds);
  const chosen: Modifier[] = [];
  for (const group of product.modifierGroups) {
    const inGroup = group.modifiers.filter((m) => wanted.has(m.id));
    if (group.selectionType === "single" && inGroup.length > 1) {
      throw new SelectionError(`Pick only one option for "${group.name}".`);
    }
    if (inGroup.length < group.minSelect) {
      throw new SelectionError(`Please choose an option for "${group.name}".`);
    }
    if (group.maxSelect != null && inGroup.length > group.maxSelect) {
      throw new SelectionError(`Too many options chosen for "${group.name}".`);
    }
    chosen.push(...inGroup);
  }

  // Reject any modifier id that does not belong to this product's groups.
  const validIds = new Set(
    product.modifierGroups.flatMap((g) => g.modifiers.map((m) => m.id))
  );
  for (const id of wanted) {
    if (!validIds.has(id)) {
      throw new SelectionError("One of the selected options is not valid.");
    }
  }

  const base =
    variant?.priceCents ??
    product.basePriceCents ??
    product.variants.find((v) => v.isDefault)?.priceCents ??
    0;
  const modTotal = chosen.reduce((sum, m) => sum + m.priceCents, 0);

  return { variant, modifiers: chosen, unitPriceCents: base + modTotal };
}

// A stable signature for "is this the same configured line?" — used to merge a
// repeat add-to-cart into the existing line (quantity += n) instead of stacking
// duplicate rows. Notes differing keeps lines separate.
export function lineSignature(
  productId: string,
  variantId: string | null,
  modifierIds: string[],
  notes: string | null
): string {
  return [
    productId,
    variantId ?? "-",
    [...modifierIds].sort().join("+") || "-",
    (notes ?? "").trim().toLowerCase() || "-",
  ].join("|");
}
