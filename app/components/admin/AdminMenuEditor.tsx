"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/app/lib/types";
import { formatCents } from "@/app/lib/money";
import { isPerPersonCategory } from "@/app/lib/catering/config";

const CATEGORY_ORDER = ["Boxed Lunches", "Wraps", "Trays", "Add-Ons"] as const;

type Draft = {
  id: string | null;
  name: string;
  description: string;
  priceDollars: string;
  category: string;
  image: string;
  isAvailable: boolean;
  sortOrder: number;
};

function draftFrom(p: Product): Draft {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    priceDollars: ((p.basePriceCents ?? 0) / 100).toFixed(2),
    category: p.category,
    image: p.image ?? "",
    isAvailable: p.isAvailable,
    sortOrder: p.sortOrder,
  };
}

function blankDraft(): Draft {
  return {
    id: null,
    name: "",
    description: "",
    priceDollars: "0.00",
    category: "Boxed Lunches",
    image: "",
    isAvailable: true,
    sortOrder: 0,
  };
}

export function AdminMenuEditor({ initialItems }: { initialItems: Product[] }) {
  const [items, setItems] = useState<Product[]>(initialItems);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
    return CATEGORY_ORDER.map((category) => ({
      category,
      products: visible
        .filter((p) => p.category === category)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    })).filter((g) => g.products.length > 0);
  }, [items, query]);

  function priceLabel(p: Product) {
    const base = formatCents(p.basePriceCents ?? 0);
    return isPerPersonCategory(p.category) ? `${base} / person` : base;
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setEditing((d) => (d ? { ...d, [key]: value } : d));
  }

  async function save() {
    if (!editing) return;
    const basePriceCents = Math.round(parseFloat(editing.priceDollars || "0") * 100);
    if (!editing.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (Number.isNaN(basePriceCents) || basePriceCents < 0) {
      setError("Enter a valid price.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      ...(editing.id ? { id: editing.id } : {}),
      name: editing.name.trim(),
      description: editing.description.trim() || null,
      basePriceCents,
      category: editing.category,
      image: editing.image.trim() || null,
      isAvailable: editing.isAvailable,
      sortOrder: Number(editing.sortOrder) || 0,
    };
    try {
      const res = await fetch("/api/admin/menu", {
        method: editing.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.error || "Could not save. Please try again.");
        setSaving(false);
        return;
      }
      const data = await res.json().catch(() => ({}));
      const row = Array.isArray(data) ? data[0] : data;
      const id = (editing.id ?? row?.id ?? crypto.randomUUID()) as string;
      const updated: Product = {
        id,
        slug: row?.slug ?? `catering-${id}`,
        name: body.name,
        description: body.description,
        basePriceCents,
        menu: "catering",
        category: body.category,
        image: body.image,
        isAvailable: body.isAvailable,
        sortOrder: body.sortOrder,
        variants: [],
        modifierGroups: [],
      };
      setItems((prev) =>
        editing.id ? prev.map((p) => (p.id === editing.id ? { ...p, ...updated } : p)) : [updated, ...prev]
      );
      setSavedNote(`Saved “${body.name}”.`);
      setEditing(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!editing?.id) return;
    if (!window.confirm(`Delete “${editing.name}”? This removes it from the menu.`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/menu?id=${editing.id}`, { method: "DELETE" });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.error || "Could not delete.");
        setSaving(false);
        return;
      }
      setItems((prev) => prev.filter((p) => p.id !== editing.id));
      setSavedNote(`Deleted “${editing.name}”.`);
      setEditing(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-lg border border-copper/30 bg-paper px-3 py-2 text-body text-ink outline-none focus:border-copper";
  const label = "font-display text-xs uppercase tracking-widest text-copper";

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-h2 text-ink">Catering Menu</h1>
            <p className="text-small text-warm-gray">Edit items, prices, availability, and photos.</p>
          </div>
          <button
            onClick={() => {
              setEditing(blankDraft());
              setError(null);
            }}
            className="font-display rounded-pill bg-maroon px-5 py-2.5 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
          >
            + Add menu item
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items…"
          aria-label="Search menu items"
          className={`${field} mt-5 max-w-sm`}
        />

        {savedNote && (
          <p role="status" className="mt-3 text-small text-olive">
            {savedNote}
          </p>
        )}

        <div className="mt-6 space-y-8">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="font-display text-h4 text-maroon">{group.category}</h2>
              <ul className="mt-3 divide-y divide-copper/15 rounded-2xl border border-copper/20 bg-paper">
                {group.products.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-display text-body text-ink">{p.name}</p>
                      <p className="text-small text-warm-gray">{priceLabel(p)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-pill px-2.5 py-1 text-xs uppercase tracking-widest ${
                          p.isAvailable ? "bg-olive/15 text-olive" : "bg-maroon/10 text-maroon"
                        }`}
                      >
                        {p.isAvailable ? "Available" : "Sold out"}
                      </span>
                      <button
                        onClick={() => {
                          setEditing(draftFrom(p));
                          setError(null);
                        }}
                        aria-label={`Edit ${p.name}`}
                        className="font-display rounded-pill border border-copper/40 px-4 py-1.5 text-small uppercase tracking-widest text-maroon transition-colors hover:bg-cream"
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {grouped.length === 0 && (
            <p className="text-warm-gray">No items match “{query}”.</p>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-ink/60"
            onClick={() => setEditing(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editing.id ? `Edit ${editing.name}` : "Add menu item"}
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-paper p-6 shadow-float sm:rounded-2xl"
          >
            <h3 className="font-display text-h3 text-ink">
              {editing.id ? "Edit item" : "Add menu item"}
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="m-name" className={label}>Name</label>
                <input id="m-name" value={editing.name} onChange={(e) => update("name", e.target.value)} className={field} />
              </div>
              <div>
                <label htmlFor="m-desc" className={label}>Description</label>
                <textarea id="m-desc" rows={3} value={editing.description} onChange={(e) => update("description", e.target.value)} className={field} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="m-price" className={label}>Price ($)</label>
                  <input id="m-price" type="number" min={0} step="0.01" value={editing.priceDollars} onChange={(e) => update("priceDollars", e.target.value)} className={field} />
                </div>
                <div>
                  <label htmlFor="m-cat" className={label}>Category</label>
                  <select id="m-cat" value={editing.category} onChange={(e) => update("category", e.target.value)} className={field}>
                    {CATEGORY_ORDER.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="m-img" className={label}>Image path / URL</label>
                <input id="m-img" value={editing.image} onChange={(e) => update("image", e.target.value)} placeholder="/img/catering/…" className={field} />
              </div>
              <div className="grid grid-cols-2 items-end gap-4">
                <div>
                  <label htmlFor="m-sort" className={label}>Sort order</label>
                  <input id="m-sort" type="number" value={editing.sortOrder} onChange={(e) => update("sortOrder", Number(e.target.value))} className={field} />
                </div>
                <label className="flex items-center gap-2 py-2">
                  <input type="checkbox" checked={editing.isAvailable} onChange={(e) => update("isAvailable", e.target.checked)} className="accent-maroon" />
                  <span className="text-body text-ink">Available</span>
                </label>
              </div>
            </div>

            {error && <p role="alert" className="mt-3 text-small text-maroon">{error}</p>}

            <div className="mt-6 flex items-center justify-between gap-3">
              {editing.id ? (
                <button onClick={del} disabled={saving} className="font-display text-small uppercase tracking-widest text-maroon hover:text-copper disabled:opacity-40">
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <button onClick={() => setEditing(null)} disabled={saving} className="font-display rounded-pill border border-copper/40 px-5 py-2.5 text-small uppercase tracking-widest text-ink hover:bg-cream disabled:opacity-40">
                  Cancel
                </button>
                <button onClick={save} disabled={saving} className="font-display rounded-pill bg-maroon px-6 py-2.5 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon disabled:opacity-40">
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
