// Domain types shared by the catalog, cart, and checkout layers. These mirror
// the Supabase tables (see the schema migration) but are hand-written so the UI
// and server code share one vocabulary regardless of the storage adapter.

export type SelectionType = "single" | "multiple";

export type Modifier = {
  id: string;
  name: string;
  priceCents: number;
  isDefault: boolean;
  sortOrder: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  selectionType: SelectionType;
  /** Minimum selections required (0 = optional). */
  minSelect: number;
  /** Maximum selections allowed (null = unlimited). */
  maxSelect: number | null;
  sortOrder: number;
  modifiers: Modifier[];
};

export type ProductVariant = {
  id: string;
  name: string; // "Cup", "Bowl", "Regular"
  priceCents: number;
  isDefault: boolean;
  sortOrder: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** Base price when the product is not variant-priced; null when variants set price. */
  basePriceCents: number | null;
  menu: string; // "Breakfast" | "Lunch"
  category: string; // section title
  image: string | null;
  isAvailable: boolean;
  sortOrder: number;
  variants: ProductVariant[];
  modifierGroups: ModifierGroup[];
};

/** The lowest price a product can be ordered at — used for "from $X" display. */
export function productFromPriceCents(p: Product): number {
  if (p.variants.length > 0) {
    return Math.min(...p.variants.map((v) => v.priceCents));
  }
  return p.basePriceCents ?? 0;
}

// ---- Cart ----

export type CartItemModifier = {
  modifierId: string;
  name: string;
  priceCents: number;
};

export type CartItem = {
  id: string;
  productId: string;
  productSlug: string;
  name: string; // snapshot of product name at add time
  image: string | null;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  /** Unit price = base/variant + modifiers, snapshotted at add time. */
  unitPriceCents: number;
  /** unitPriceCents * quantity. */
  lineTotalCents: number;
  modifiers: CartItemModifier[];
  notes: string | null;
};

export type Cart = {
  id: string;
  items: CartItem[];
  /** Sum of item quantities — drives the header badge. */
  itemCount: number;
  subtotalCents: number;
};

export const EMPTY_CART: Cart = {
  id: "",
  items: [],
  itemCount: 0,
  subtotalCents: 0,
};

// ---- Add-to-cart request (UI → server action) ----

export type SelectedModifiers = string[]; // modifier ids

export type AddToCartInput = {
  productId: string;
  variantId: string | null;
  modifierIds: string[];
  quantity: number;
  notes?: string | null;
};

// ---- Menu grouping (for the menu UI) ----

export type CategoryGroup = { category: string; products: Product[] };
export type MenuGroup = { menu: string; categories: CategoryGroup[] };
