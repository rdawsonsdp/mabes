"use client";

import { useMemo, useRef, useState } from "react";
import type { Product } from "@/app/lib/types";
import { formatCents } from "@/app/lib/money";
import { useCateringCart } from "./CateringCartProvider";
import { useDialog } from "@/app/components/cart/useDialog";
import { validateModifierSelection } from "@/app/lib/catering/validation";
import { isPerPersonCategory, PER_PERSON_MIN_GUESTS } from "@/app/lib/catering/config";
import { Close, Minus, Plus } from "@/app/components/icons";
import type { SelectedModifier } from "@/app/lib/catering/types";

function unitPriceCents(product: Product, selected: Set<string>): number {
  const base = product.basePriceCents ?? 0;
  const mods = product.modifierGroups
    .flatMap((g) => g.modifiers)
    .filter((m) => selected.has(m.id))
    .reduce((sum, m) => sum + m.priceCents, 0);
  return base + mods;
}

function defaultSelection(product: Product): Set<string> {
  const selected = new Set<string>();
  for (const g of product.modifierGroups) {
    // Preselect a single-select group's default/first; never auto-pick a
    // multi-select "pick N" group (the user must choose).
    if (g.selectionType === "single" && g.minSelect >= 1) {
      const def = g.modifiers.find((m) => m.isDefault) ?? g.modifiers[0];
      if (def) selected.add(def.id);
    } else if (g.selectionType === "single") {
      const def = g.modifiers.find((m) => m.isDefault);
      if (def) selected.add(def.id);
    }
    // multi-select groups never auto-select — the user must make all choices.
  }
  return selected;
}

function buildModifiers(product: Product, selected: Set<string>): SelectedModifier[] {
  const out: SelectedModifier[] = [];
  for (const g of product.modifierGroups) {
    for (const m of g.modifiers) {
      if (selected.has(m.id)) {
        out.push({ modifierId: m.id, groupId: g.id, name: m.name, priceCents: m.priceCents });
      }
    }
  }
  return out;
}

export function CateringItemModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addItem } = useCateringCart();
  const perPerson = isPerPersonCategory(product.category);
  const minQty = perPerson ? PER_PERSON_MIN_GUESTS : 1;
  const init = useMemo(() => defaultSelection(product), [product]);
  const [selected, setSelected] = useState<Set<string>>(init);
  const [quantity, setQuantity] = useState(minQty);
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useDialog(panelRef, true, onClose);

  const validation = validateModifierSelection(product.modifierGroups, selected);
  const unit = unitPriceCents(product, selected);
  const total = unit * quantity;

  function toggleModifier(
    selectionType: "single" | "multiple",
    groupModifierIds: string[],
    id: string,
    max: number | null
  ) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (selectionType === "single") {
        groupModifierIds.forEach((mid) => next.delete(mid));
        next.add(id);
      } else if (next.has(id)) {
        next.delete(id);
      } else {
        const countInGroup = groupModifierIds.filter((mid) => next.has(mid)).length;
        if (max != null && countInGroup >= max) return prev; // at limit
        next.add(id);
      }
      return next;
    });
  }

  function handleAdd() {
    if (!validation.ok) {
      setShowErrors(true);
      return;
    }
    addItem({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      category: product.category,
      image: product.image,
      quantity,
      unitPriceCents: unit,
      selectedModifiers: buildModifiers(product, selected),
      notes: notes.trim() || null,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Customize ${product.name}`}
    >
      <button aria-label="Close" className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-paper shadow-float outline-none sm:rounded-2xl"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-copper/20 p-5">
          <div>
            <h3 className="font-display text-h3 leading-tight text-ink">{product.name}</h3>
            {product.description && <p className="mt-1 text-small text-warm-gray">{product.description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-warm-gray transition-colors hover:bg-cream hover:text-ink"
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        {/* options */}
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {product.modifierGroups.map((g) => {
            const ids = g.modifiers.map((m) => m.id);
            const groupErr = showErrors ? validation.byGroup[g.id] : { ok: true, message: null };
            const required = g.minSelect >= 1;
            const hint =
              g.maxSelect != null && g.minSelect === g.maxSelect
                ? `(pick ${g.minSelect})`
                : required
                  ? "(required)"
                  : g.selectionType === "multiple"
                    ? "(optional)"
                    : "(choose one)";
            return (
              <fieldset key={g.id}>
                <legend className="font-display text-small uppercase tracking-widest text-copper">
                  {g.name}
                  <span className="ml-2 normal-case tracking-normal text-warm-gray">{hint}</span>
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
                {groupErr && !groupErr.ok && (
                  <p role="alert" className="mt-2 text-small text-maroon">
                    {groupErr.message}
                  </p>
                )}
              </fieldset>
            );
          })}

          <div>
            <label htmlFor="catering-item-notes" className="font-display text-small uppercase tracking-widest text-copper">
              Special instructions
            </label>
            <textarea
              id="catering-item-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={280}
              placeholder="Allergies, labeling, setup notes…"
              className="mt-2 w-full rounded-lg border border-copper/25 bg-paper px-3 py-2 text-small text-ink outline-none placeholder:text-warm-gray/70 focus:border-copper"
            />
          </div>
        </div>

        {/* footer: qty + add */}
        <div className="flex items-end gap-3 border-t border-copper/20 p-5">
          <div className="flex flex-col">
            <label
              htmlFor="catering-qty"
              className="font-display text-[11px] uppercase tracking-widest text-copper"
            >
              {perPerson ? "How many guests?" : "Quantity"}
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-pill border border-copper/40 px-2 py-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
                aria-label="Decrease quantity"
                className="rounded-full p-1 text-maroon transition-colors hover:bg-cream disabled:opacity-40"
                disabled={quantity <= minQty}
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                id="catering-qty"
                type="number"
                min={minQty}
                max={99}
                value={quantity}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setQuantity(Number.isNaN(n) ? minQty : Math.min(99, Math.max(minQty, n)));
                }}
                aria-label={perPerson ? "Number of guests" : "Quantity"}
                className="w-12 bg-transparent text-center font-display text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                aria-label="Increase quantity"
                className="rounded-full p-1 text-maroon transition-colors hover:bg-cream"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {perPerson && (
              <p className="mt-1 text-[11px] text-warm-gray">Minimum {minQty} guests</p>
            )}
          </div>
          <button
            onClick={handleAdd}
            className="font-display flex flex-1 items-center justify-center gap-2 rounded-pill bg-maroon px-6 py-3 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
          >
            Add to Order · {formatCents(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
