// Reads app/menu.json and emits idempotent SQL that seeds the catalog:
// products, size variants (Cup/Bowl), and the shared modifier groups (combo
// upgrade, salad add-ons, smoothie add-ons, breakfast veg, sandwich/wrap).
//
// The mapping rules live here (not in raw SQL) so they're reviewable and the
// seed can be regenerated whenever menu.json changes:
//   node scripts/build-seed.mjs            -> prints SQL to stdout
//   node scripts/build-seed.mjs --json     -> prints the parsed catalog as JSON
//
// Re-running is safe: every statement upserts on a natural key (slug).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const menu = JSON.parse(readFileSync(join(__dirname, "../app/menu.json"), "utf8"));

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const cents = (dollars) => Math.round(parseFloat(dollars) * 100);
const q = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);

// ---- Shared modifier groups (referenced by section) -------------------------
// price_cents are the UPCHARGES from each menu's section notes.
const MODIFIER_GROUPS = [
  {
    slug: "combo",
    name: "Make it a combo",
    selectionType: "single",
    minSelect: 0,
    maxSelect: 1,
    modifiers: [
      { slug: "none", name: "No combo", price: 0, isDefault: true },
      { slug: "chips-drink", name: "Combo — chips & a drink", price: 200 },
      { slug: "chicken-noodle", name: "Add chicken noodle soup", price: 350 },
      { slug: "turkey-chili", name: "Add turkey chili", price: 450 },
      { slug: "smoothie", name: "Add any smoothie", price: 500 },
    ],
  },
  {
    slug: "sandwich-or-wrap",
    name: "Sandwich or wrap",
    selectionType: "single",
    minSelect: 1,
    maxSelect: 1,
    modifiers: [
      { slug: "sandwich", name: "Sandwich (Panini)", price: 0, isDefault: true },
      { slug: "wrap", name: "Wrap", price: 0 },
    ],
  },
  {
    slug: "salad-addons",
    name: "Add-ons",
    selectionType: "multiple",
    minSelect: 0,
    maxSelect: null,
    modifiers: [
      { slug: "extra-meat", name: "Extra meat", price: 200 },
      { slug: "add-salmon", name: "Add salmon", price: 700 },
    ],
  },
  {
    slug: "smoothie-addons",
    name: "Boost it",
    selectionType: "multiple",
    minSelect: 0,
    maxSelect: null,
    modifiers: [
      { slug: "protein-shot", name: "Protein shot", price: 100 },
      { slug: "extra-fruit", name: "Extra fruit", price: 100 },
    ],
  },
  {
    slug: "breakfast-veg",
    name: "Extra vegetables",
    selectionType: "multiple",
    minSelect: 0,
    maxSelect: null,
    modifiers: [
      { slug: "extra-onions", name: "Extra onions", price: 75 },
      { slug: "extra-green-peppers", name: "Extra green peppers", price: 75 },
      { slug: "extra-cheese", name: "Extra cheese", price: 75 },
    ],
  },
];

// Section title -> { groups: [groupSlug], basePrice?: cents (backfill when an
// item in that section has no listed price) }
const SECTION_RULES = {
  "Sandwiches / Wraps": { groups: ["sandwich-or-wrap", "combo"] },
  Salads: { groups: ["salad-addons"] },
  Smoothies: { groups: ["smoothie-addons"], basePrice: 800 },
  "Mabe's Kids": { groups: [], basePrice: 600 },
  "Breakfast Bowls": { groups: ["breakfast-veg"] },
};

// "Cup $5.00 · Bowl $6.50" -> [{name:'Cup',cents:500},{name:'Bowl',cents:650}]
// Single price -> null (caller uses base_price instead).
function parseVariants(priceStr) {
  const parts = String(priceStr).split("·").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const variants = [];
  for (const part of parts) {
    const m = part.match(/^(.*?)\$\s*(\d+(?:\.\d{1,2})?)/);
    if (!m) return null;
    variants.push({ name: m[1].trim() || "Regular", cents: cents(m[2]) });
  }
  return variants;
}

function parseSingle(priceStr) {
  const m = String(priceStr ?? "").match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  return m ? cents(m[1]) : null;
}

// ---- Build the catalog ------------------------------------------------------
const products = [];
let sortCursor = 0;

for (const m of menu.menus) {
  const menuName = m.name.replace(/ Menu$/, ""); // "Breakfast" / "Lunch"
  for (const sec of m.sections) {
    const rule = SECTION_RULES[sec.title] ?? { groups: [] };
    for (const it of sec.items) {
      const variants = parseVariants(it.price ?? "");
      let basePrice = null;
      if (!variants) {
        basePrice = parseSingle(it.price) ?? rule.basePrice ?? null;
      }
      products.push({
        slug: `${slug(menuName)}-${slug(it.name)}`,
        name: it.name,
        description: it.desc || null,
        basePriceCents: basePrice,
        menu: menuName,
        category: sec.title,
        sortOrder: sortCursor++,
        variants: (variants ?? []).map((v, i) => ({
          name: v.name,
          priceCents: v.cents,
          isDefault: i === 0,
          sortOrder: i,
        })),
        groupSlugs: rule.groups,
      });
    }
  }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ modifierGroups: MODIFIER_GROUPS, products }, null, 2));
  process.exit(0);
}

// ---- Emit SQL ---------------------------------------------------------------
const out = [];
out.push("-- Generated by scripts/build-seed.mjs — do not edit by hand.");
out.push("begin;");

// modifier groups + modifiers
for (const [gi, g] of MODIFIER_GROUPS.entries()) {
  out.push(
    `insert into modifier_groups (slug, name, selection_type, min_select, max_select, sort_order) values (` +
      `${q(g.slug)}, ${q(g.name)}, ${q(g.selectionType)}, ${g.minSelect}, ${g.maxSelect ?? "null"}, ${gi}) ` +
      `on conflict (slug) do update set name=excluded.name, selection_type=excluded.selection_type, ` +
      `min_select=excluded.min_select, max_select=excluded.max_select, sort_order=excluded.sort_order;`
  );
  for (const [mi, mod] of g.modifiers.entries()) {
    out.push(
      `insert into modifiers (group_id, slug, name, price_cents, is_default, sort_order) values (` +
        `(select id from modifier_groups where slug=${q(g.slug)}), ${q(mod.slug)}, ${q(mod.name)}, ` +
        `${mod.price}, ${mod.isDefault ? "true" : "false"}, ${mi}) ` +
        `on conflict (group_id, slug) do update set name=excluded.name, price_cents=excluded.price_cents, ` +
        `is_default=excluded.is_default, sort_order=excluded.sort_order;`
    );
  }
}

// products + variants + group links
for (const p of products) {
  out.push(
    `insert into products (slug, name, description, base_price_cents, menu, category, sort_order) values (` +
      `${q(p.slug)}, ${q(p.name)}, ${q(p.description)}, ${p.basePriceCents ?? "null"}, ` +
      `${q(p.menu)}, ${q(p.category)}, ${p.sortOrder}) ` +
      `on conflict (slug) do update set name=excluded.name, description=excluded.description, ` +
      `base_price_cents=excluded.base_price_cents, menu=excluded.menu, category=excluded.category, ` +
      `sort_order=excluded.sort_order, updated_at=now();`
  );
  for (const v of p.variants) {
    out.push(
      `insert into product_variants (product_id, name, price_cents, is_default, sort_order) values (` +
        `(select id from products where slug=${q(p.slug)}), ${q(v.name)}, ${v.priceCents}, ` +
        `${v.isDefault ? "true" : "false"}, ${v.sortOrder}) ` +
        `on conflict (product_id, name) do update set price_cents=excluded.price_cents, ` +
        `is_default=excluded.is_default, sort_order=excluded.sort_order;`
    );
  }
  for (const [i, gslug] of p.groupSlugs.entries()) {
    out.push(
      `insert into product_modifier_groups (product_id, group_id, sort_order) ` +
        `select p.id, g.id, ${i} from products p, modifier_groups g ` +
        `where p.slug=${q(p.slug)} and g.slug=${q(gslug)} on conflict (product_id, group_id) do nothing;`
    );
  }
}

out.push("commit;");
console.log(out.join("\n"));
