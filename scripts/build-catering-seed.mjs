// Generated catering catalog seed. Mirrors scripts/build-seed.mjs conventions:
// idempotent upserts on natural keys (slug / group_id+slug / product_id+group_id),
// menu='catering', categories Boxed Lunches | Wraps | Trays | Add-Ons.
//   node scripts/build-catering-seed.mjs            -> prints SQL to stdout
//   node scripts/build-catering-seed.mjs --json     -> prints the parsed catalog as JSON
// Re-running the SQL is safe.

const q = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);

// ---- Two catering modifier groups -----------------------------------------
// TODO-to-capture: exact cheese options per "+" item and the per-tray eligible
// "pick 2" type lists are OPEN (confirm by clicking each "+" item on the live
// BentoBox store). Placeholders below are seeded so the UI/tests have data; a
// single shared 'catering-tray-pick2' group may later split into per-tray groups.
const MODIFIER_GROUPS = [
  {
    slug: "catering-cheese",
    name: "Choice of cheese",
    selectionType: "single",
    minSelect: 1,
    maxSelect: 1,
    sortOrder: 100,
    modifiers: [
      { slug: "swiss", name: "Swiss", price: 0, isDefault: true },
      { slug: "pepper-jack", name: "Pepper Jack", price: 0 },
      { slug: "cheddar", name: "Cheddar", price: 0 },
      { slug: "american", name: "American", price: 0 },
    ],
  },
  {
    slug: "catering-tray-pick2",
    name: "Select 2 types",
    selectionType: "multiple",
    minSelect: 2,
    maxSelect: 2,
    sortOrder: 101,
    // TODO-to-capture: real per-tray type lists from BentoBox.
    modifiers: [
      { slug: "turkey-pastrami", name: "Turkey Pastrami", price: 0 },
      { slug: "the-773", name: "Turkey & Corned Beef (The 773)", price: 0 },
      { slug: "blackened-greek-chicken", name: "Blackened Greek Chicken", price: 0 },
      { slug: "grilled-veggie", name: "Grilled Veggie", price: 0 },
      { slug: "walnut-raisin-chicken-salad", name: "Walnut Raisin Chicken Salad", price: 0 },
      { slug: "chickpea-tuna", name: "Chickpea Tuna", price: 0 },
    ],
  },
];

// ---- 28 catering products (order defines sort_order) ----------------------
// groupSlugs: which modifier groups attach to each item.
const PRODUCTS = [
  // Boxed Lunches (served with chips)
  { slug: "catering-the-blue-fish-box", name: "The Blue Fish Sandwich Box", description: "Tuna Salad w/ Pepper Jack on Texas Toast. Served with chips.", priceCents: 1200, category: "Boxed Lunches", groupSlugs: ["catering-cheese"] },
  { slug: "catering-yazzys-turkey-pastrami", name: "Turkey Pastrami - Yazzy's Special", description: "Turkey pastrami + corned beef, Dijon, Swiss, red onion, pickles. Served with chips.", priceCents: 1450, category: "Boxed Lunches", groupSlugs: ["catering-cheese"] },
  { slug: "catering-the-773", name: "Turkey & Corned Beef - The 773", description: "Roasted turkey + corned beef, sauerkraut, mustard, Swiss. Served with chips.", priceCents: 1450, category: "Boxed Lunches", groupSlugs: ["catering-cheese"] },
  { slug: "catering-dj-jerk-turkey-panini", name: "DJ Jerk Turkey Panini", description: "Turkey + jerk sauce, turkey bacon, red onion, spinach, Swiss, roasted red pepper mayo on panini bread. Served with chips.", priceCents: 1350, category: "Boxed Lunches", groupSlugs: ["catering-cheese"] },
  { slug: "catering-double-decker-turkey-club", name: "Mabe's Double Decker Turkey Club", description: "Turkey, turkey bacon, herb mayo, greens, choice of cheese. Served with chips.", priceCents: 1450, category: "Boxed Lunches", groupSlugs: ["catering-cheese"] },
  { slug: "catering-lemon-garlic-salmon-roll", name: "Lemon Garlic Salmon Roll", description: "Baked salmon, red onion (Fish · Shellfish). Served with chips.", priceCents: 1800, category: "Boxed Lunches", groupSlugs: [] },
  { slug: "catering-grilled-veggie-sandwich", name: "Grilled Veggie Sandwich", description: "Peppers, onions, sweet potato, spinach, multigrain, garlic, mayo, dill, avocado (Vegetarian). Served with chips.", priceCents: 1100, category: "Boxed Lunches", groupSlugs: ["catering-cheese"] },
  { slug: "catering-chickpea-tuna", name: "Chickpea Tuna Sandwich (Vegan)", description: "Chickpeas, vegan mayo, relish, onions, multigrain (Vegan · Vegetarian). Served with chips.", priceCents: 1100, category: "Boxed Lunches", groupSlugs: ["catering-cheese"] },
  { slug: "catering-walnut-raisin-chicken-salad", name: "Walnut Raisin Chicken Salad Sandwich", description: "Chicken salad with walnuts & raisins (Peanut · Tree Nut). Served with chips.", priceCents: 1300, category: "Boxed Lunches", groupSlugs: ["catering-cheese"] },
  { slug: "catering-jerk-salmon-panini", name: "Jerk Salmon Panini", description: "Grilled salmon, jerk, red onion, spinach, Swiss, roasted red pepper mayo on panini (Fish). Served with chips.", priceCents: 1400, category: "Boxed Lunches", groupSlugs: [] },

  // Wraps (basic boxes served with chips)
  { slug: "catering-blackened-greek-chicken-wrap", name: "Blackened Greek Chicken Wrap", description: "Blackened chicken, greens, tomato, peppers, cucumber, red onion, giardiniera. Served with chips.", priceCents: 1400, category: "Wraps", groupSlugs: ["catering-cheese"] },
  { slug: "catering-mae-annas-jerk-chicken-wrap", name: "Mae Anna's Jerk Chicken Wrap", description: "Chicken + jerk sauce, slaw. Served with chips.", priceCents: 1350, category: "Wraps", groupSlugs: [] },
  { slug: "catering-devins-buffalo-chicken-wrap", name: "Devin's Buffalo Chicken Wrap", description: "Buffalo chicken, turkey bacon, greens, onion, tomato, ranch, pepper jack. Served with chips.", priceCents: 1400, category: "Wraps", groupSlugs: ["catering-cheese"] },
  { slug: "catering-grilled-veggie-wrap", name: "Grilled Veggie Wrap", description: "Peppers, onions, sweet potato, spinach wrap, avocado, vegan garlic dill (Vegan · Vegetarian). Served with chips.", priceCents: 950, category: "Wraps", groupSlugs: [] },
  { slug: "catering-jerk-salmon-wrap", name: "Jerk Salmon Wrap", description: "Grilled salmon, greens, tomato, red onion, pepper jack (Fish). Served with chips.", priceCents: 1400, category: "Wraps", groupSlugs: [] },

  // Trays (tray only; chips, cookies, beverages sold separately)
  { slug: "catering-customer-fave-sandwich-tray", name: "Mabe's Customer Fave Sandwich Tray", description: "Choice of 2 sandwich types, serves 10 (20 halves).", priceCents: 12500, category: "Trays", groupSlugs: ["catering-tray-pick2"] },
  { slug: "catering-walnut-raisin-chicken-salad-tray", name: "Walnut Raisin Chicken Salad Sandwich Tray", description: "Choice of 2, serves 10 (contains nuts).", priceCents: 13000, category: "Trays", groupSlugs: ["catering-tray-pick2"] },
  { slug: "catering-lemon-dill-salmon-roll-tray", name: "Lemon Dill Salmon Roll Tray", description: "Feeds 10-20, 20 rolls (Dairy · Fish).", priceCents: 17000, category: "Trays", groupSlugs: [] },
  { slug: "catering-wrap-tray", name: "Mabe's Wrap Tray", description: "Choice of 2 wrap types, serves 10 (20 halves).", priceCents: 12500, category: "Trays", groupSlugs: ["catering-tray-pick2"] },
  { slug: "catering-veggie-vegan-wrap-tray", name: "Veggie/Vegan Wrap Tray", description: "Choice of veggie/vegan types, serves 10.", priceCents: 10000, category: "Trays", groupSlugs: ["catering-tray-pick2"] },

  // Add-Ons
  { slug: "catering-1-gal-lemonade", name: "1 Gallon Lemonade", description: null, priceCents: 1000, category: "Add-Ons", groupSlugs: [] },
  { slug: "catering-1-gal-strawberry-lemonade", name: "1 Gallon Strawberry Lemonade", description: null, priceCents: 1200, category: "Add-Ons", groupSlugs: [] },
  { slug: "catering-1-dozen-cookies", name: "1 Dozen Cookies", description: null, priceCents: 1200, category: "Add-Ons", groupSlugs: [] },
  { slug: "catering-family-house-salad", name: "Family Size House Salad", description: null, priceCents: 5000, category: "Add-Ons", groupSlugs: [] },
  { slug: "catering-soup-for-a-group", name: "Today's Soup for a Group", description: "96 oz.", priceCents: 4000, category: "Add-Ons", groupSlugs: [] },
  { slug: "catering-chili-for-a-group", name: "Chili for a Group", description: "Turkey + beans, 96 oz.", priceCents: 5000, category: "Add-Ons", groupSlugs: [] },
  { slug: "catering-1-dozen-soda-cans", name: "1 Dozen Soda Cans", description: null, priceCents: 1600, category: "Add-Ons", groupSlugs: [] },
  { slug: "catering-1-dozen-bottled-water", name: "1 Dozen Bottled Water", description: null, priceCents: 1200, category: "Add-Ons", groupSlugs: [] },
];

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ modifierGroups: MODIFIER_GROUPS, products: PRODUCTS }, null, 2));
  process.exit(0);
}

const out = [];
out.push("-- Generated by scripts/build-catering-seed.mjs — do not edit by hand.");
out.push("begin;");

// modifier groups + modifiers
for (const g of MODIFIER_GROUPS) {
  out.push(
    `insert into modifier_groups (slug, name, selection_type, min_select, max_select, sort_order) values (` +
      `${q(g.slug)}, ${q(g.name)}, ${q(g.selectionType)}, ${g.minSelect}, ${g.maxSelect ?? "null"}, ${g.sortOrder}) ` +
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

// products + group links
for (const [pi, p] of PRODUCTS.entries()) {
  out.push(
    `insert into products (slug, name, description, base_price_cents, menu, category, sort_order) values (` +
      `${q(p.slug)}, ${q(p.name)}, ${q(p.description)}, ${p.priceCents ?? "null"}, ` +
      `${q("catering")}, ${q(p.category)}, ${pi}) ` +
      `on conflict (slug) do update set name=excluded.name, description=excluded.description, ` +
      `base_price_cents=excluded.base_price_cents, menu=excluded.menu, category=excluded.category, ` +
      `sort_order=excluded.sort_order, updated_at=now();`
  );
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
