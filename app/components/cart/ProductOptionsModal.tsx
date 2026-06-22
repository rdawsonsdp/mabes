"use client";

import { useMemo, useRef, useState } from "react";
import type { Product } from "@/app/lib/types";
import { formatCents } from "@/app/lib/money";
import { useCart } from "./CartProvider";
import { useDialog } from "./useDialog";
import { Close, Minus, Plus, Spinner } from "../icons";

// Computes the live unit price as options change — a client mirror of the
// server pricing in lib/cart/pricing.ts. The server recomputes authoritatively
// on add, so this is display-only.
function unitPrice(product: Product, variantId: string | null, selected: Set<string>): number {
  const base =
    product.variants.find((v) => v.id === variantId)?.priceCents ??
    product.basePriceCents ??
    product.variants.find((v) => v.isDefault)?.priceCents ??
    0;
  const mods = product.modifierGroups
    .flatMap((g) => g.modifiers)
    .filter((m) => selected.has(m.id))
    .reduce((sum, m) => sum + m.priceCents, 0);
  return base + mods;
}

function defaultSelection(product: Product): { variantId: string | null; modifiers: Set<string> } {
  const variantId =
    product.variants.find((v) => v.isDefault)?.id ?? product.variants[0]?.id ?? null;
  const modifiers = new Set<string>();
  for (const g of product.modifierGroups) {
    // Preselect a default for any group that ships one (e.g. combo -> "No combo",
    // required single groups -> their default), so the item is valid to add.
    const def = g.modifiers.find((m) => m.isDefault);
    if (def) modifiers.add(def.id);
    else if (g.selectionType === "single" && g.minSelect >= 1 && g.modifiers[0]) {
      modifiers.add(g.modifiers[0].id);
    }
  }
  return { variantId, modifiers };
}

export function ProductOptionsModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const init = useMemo(() => defaultSelection(product), [product]);
  const [variantId, setVariantId] = useState<string | null>(init.variantId);
  const [selected, setSelected] = useState<Set<string>>(init.modifiers);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useDialog(panelRef, true, onClose);

  const total = unitPrice(product, variantId, selected) * quantity;

  function toggleModifier(groupSelection: "single" | "multiple", groupModifierIds: string[], id: string, max: number | null) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (groupSelection === "single") {
        // radio: clear the rest of this group, set this one
        groupModifierIds.forEach((mid) => next.delete(mid));
        next.add(id);
      } else {
        if (next.has(id)) {
          next.delete(id);
        } else {
          const countInGroup = groupModifierIds.filter((mid) => next.has(mid)).length;
          if (max != null && countInGroup >= max) return prev; // at limit
          next.add(id);
        }
      }
      return next;
    });
  }

  async function handleAdd() {
    setSubmitting(true);
    setError(null);
    const res = await addItem({
      productId: product.id,
      variantId,
      modifierIds: [...selected],
      quantity,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (res.ok) onClose();
    else setError(res.error ?? "Could not add to cart.");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Customize ${product.name}`}
    >
      <button
        aria-label="Close"
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-paper shadow-float outline-none sm:rounded-2xl"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-copper/20 p-5">
          <div>
            <h3 className="font-display text-h3 leading-tight text-ink">{product.name}</h3>
            {product.description && (
              <p className="mt-1 text-small text-warm-gray">{product.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-warm-gray transition-colors hover:bg-cream hover:text-ink"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        {/* options (scrollable) */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {product.variants.length > 0 && (
            <fieldset>
              <legend className="font-display text-small uppercase tracking-widest text-copper">
                Size
              </legend>
              <div className="mt-3 space-y-2">
                {product.variants.map((v) => (
                  <label
                    key={v.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                      variantId === v.id ? "border-copper bg-cream" : "border-copper/25 hover:bg-cream/50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="variant"
                        className="accent-maroon"
                        checked={variantId === v.id}
                        onChange={() => setVariantId(v.id)}
                      />
                      <span className="text-ink">{v.name}</span>
                    </span>
                    <span className="font-display text-maroon">{formatCents(v.priceCents)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {product.modifierGroups.map((g) => {
            const ids = g.modifiers.map((m) => m.id);
            const required = g.minSelect >= 1;
            return (
              <fieldset key={g.id}>
                <legend className="font-display text-small uppercase tracking-widest text-copper">
                  {g.name}
                  <span className="ml-2 normal-case tracking-normal text-warm-gray">
                    {required ? "(required)" : g.selectionType === "multiple" ? "(optional)" : "(choose one)"}
                  </span>
                </legend>
                <div className="mt-3 space-y-2">
                  {g.modifiers.map((m) => {
                    const checked = selected.has(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                          checked ? "border-copper bg-cream" : "border-copper/25 hover:bg-cream/50"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type={g.selectionType === "single" ? "radio" : "checkbox"}
                            name={`group-${g.id}`}
                            className="accent-maroon"
                            checked={checked}
                            onChange={() => toggleModifier(g.selectionType, ids, m.id, g.maxSelect)}
                          />
                          <span className="text-ink">{m.name}</span>
                        </span>
                        {m.priceCents > 0 && (
                          <span className="font-display text-maroon">+{formatCents(m.priceCents)}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <div>
            <label
              htmlFor="item-notes"
              className="font-display text-small uppercase tracking-widest text-copper"
            >
              Special instructions
            </label>
            <textarea
              id="item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={280}
              placeholder="No onions, extra napkins…"
              className="mt-2 w-full rounded-lg border border-copper/25 bg-paper px-3 py-2 text-small text-ink outline-none placeholder:text-warm-gray/70 focus:border-copper"
            />
          </div>

          {error && <p role="alert" className="text-small text-maroon">{error}</p>}
        </div>

        {/* footer: qty + add */}
        <div className="flex items-center gap-3 border-t border-copper/20 p-5">
          <div className="flex items-center gap-3 rounded-pill border border-copper/40 px-2 py-1.5">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="rounded-full p-1 text-maroon transition-colors hover:bg-cream disabled:opacity-40"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-5 text-center font-display text-ink">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              aria-label="Increase quantity"
              className="rounded-full p-1 text-maroon transition-colors hover:bg-cream"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleAdd}
            disabled={submitting}
            aria-busy={submitting}
            className="font-display flex flex-1 items-center justify-center gap-2 rounded-pill bg-maroon px-6 py-3 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon disabled:opacity-70"
          >
            {submitting ? (
              <Spinner className="h-4 w-4 animate-spin" />
            ) : (
              <>Add to Cart · {formatCents(total)}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
