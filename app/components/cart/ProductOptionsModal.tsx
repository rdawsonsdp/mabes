"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/app/lib/types";
import { formatCents } from "@/app/lib/money";
import { useCart } from "./CartProvider";
import { useDialog } from "./useDialog";
import { Bag, Close, Plus, Spinner } from "../icons";

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
  image,
  onClose,
}: {
  product: Product;
  image?: string | null;
  onClose: () => void;
}) {
  const { addItem, openCart } = useCart();
  const img = image ?? product.image;
  const init = useMemo(() => defaultSelection(product), [product]);
  const [variantId, setVariantId] = useState<string | null>(init.variantId);
  const [selected, setSelected] = useState<Set<string>>(init.modifiers);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useDialog(panelRef, true, onClose);

  const total = unitPrice(product, variantId, selected);

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

  async function add(): Promise<boolean> {
    setSubmitting(true);
    setError(null);
    const res = await addItem({
      productId: product.id,
      variantId,
      modifierIds: [...selected],
      quantity: 1,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (res.ok) return true;
    setError(res.error ?? "Could not add to bag.");
    return false;
  }

  // Add to bag → close, keep browsing. Go to bag → add, then open the bag.
  async function handleAdd() {
    if (await add()) onClose();
  }

  async function handleAddAndGo() {
    if (await add()) {
      onClose();
      openCart();
    }
  }

  // Portal to <body> so the overlay escapes any ancestor stacking context
  // (e.g. the menu's isolated category panels) and truly covers the whole screen.
  if (typeof document === "undefined") return null;

  return createPortal(
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
        {/* hero photo — slim banner so the options/variants lead */}
        <div className="relative h-20 w-full shrink-0 bg-cream sm:h-24">
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 32rem"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cream to-copper/25">
              <span className="font-display text-small uppercase tracking-widest text-copper/70">
                Mabe&apos;s
              </span>
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-ink shadow-md transition-colors hover:bg-cream"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        {/* header */}
        <div className="border-b border-copper/20 p-5">
          <h3 className="font-display text-h3 leading-tight text-ink">{product.name}</h3>
          {product.description && (
            <p className="mt-1 text-small text-warm-gray">{product.description}</p>
          )}
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

        {/* footer: two icon actions — Add to Bag + Go to Bag */}
        <div className="flex items-stretch gap-3 border-t border-copper/20 p-4">
          <button
            onClick={handleAdd}
            disabled={submitting}
            aria-busy={submitting}
            aria-label={`Add to bag, ${formatCents(total)}`}
            className="flex flex-1 items-center justify-center gap-2.5 bg-maroon px-6 py-4 text-cream transition-colors hover:bg-copper hover:text-maroon disabled:opacity-70"
          >
            {submitting ? (
              <Spinner className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <span className="relative inline-flex">
                  <Bag className="h-6 w-6" />
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-cream text-maroon">
                    <Plus className="h-3 w-3" />
                  </span>
                </span>
                <span className="font-display text-body">{formatCents(total)}</span>
              </>
            )}
          </button>
          <button
            onClick={handleAddAndGo}
            disabled={submitting}
            aria-label="Add and go to bag"
            className="flex items-center justify-center gap-1 border border-maroon/40 px-6 py-4 text-maroon transition-colors hover:bg-cream disabled:opacity-70"
          >
            <Bag className="h-6 w-6" />
            <span className="font-display text-h4 leading-none">›</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
