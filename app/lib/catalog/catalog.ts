import { getSupabase } from "../supabase/server";
import type { Product, ProductVariant, ModifierGroup, Modifier, MenuGroup } from "../types";

// Read side of the catalog. Defined as an interface so the storage engine can be
// swapped (Supabase today, Clover-sourced later) without touching the UI.
export interface Catalog {
  getProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getProductsBySlugs(slugs: string[]): Promise<Product[]>;
  getCateringProducts(): Promise<Product[]>;
}

// One nested query pulls a product with its variants and modifier groups.
const SELECT = `
  id, slug, name, description, base_price_cents, menu, category, image, is_available, sort_order,
  product_variants ( id, name, price_cents, is_default, sort_order ),
  product_modifier_groups (
    sort_order,
    modifier_groups (
      id, name, selection_type, min_select, max_select, sort_order,
      modifiers ( id, name, price_cents, is_default, sort_order )
    )
  )
`;

type Row = Record<string, unknown>;

const num = (v: unknown): number => (typeof v === "number" ? v : Number(v) || 0);
const bySort = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

function mapVariant(r: Row): ProductVariant {
  return {
    id: String(r.id),
    name: String(r.name),
    priceCents: num(r.price_cents),
    isDefault: Boolean(r.is_default),
    sortOrder: num(r.sort_order),
  };
}

function mapModifier(r: Row): Modifier {
  return {
    id: String(r.id),
    name: String(r.name),
    priceCents: num(r.price_cents),
    isDefault: Boolean(r.is_default),
    sortOrder: num(r.sort_order),
  };
}

function mapGroup(link: Row): ModifierGroup | null {
  const g = link.modifier_groups as Row | null;
  if (!g) return null;
  return {
    id: String(g.id),
    name: String(g.name),
    selectionType: (g.selection_type as ModifierGroup["selectionType"]) ?? "single",
    minSelect: num(g.min_select),
    maxSelect: g.max_select == null ? null : num(g.max_select),
    // order groups by the per-product link order, not the global group order
    sortOrder: num(link.sort_order),
    modifiers: ((g.modifiers as Row[]) ?? []).map(mapModifier).sort(bySort),
  };
}

function mapProduct(r: Row): Product {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    description: (r.description as string) ?? null,
    basePriceCents: r.base_price_cents == null ? null : num(r.base_price_cents),
    menu: String(r.menu),
    category: String(r.category),
    image: (r.image as string) ?? null,
    isAvailable: Boolean(r.is_available),
    sortOrder: num(r.sort_order),
    variants: ((r.product_variants as Row[]) ?? []).map(mapVariant).sort(bySort),
    modifierGroups: ((r.product_modifier_groups as Row[]) ?? [])
      .map(mapGroup)
      .filter((g): g is ModifierGroup => g !== null)
      .sort(bySort),
  };
}

class SupabaseCatalog implements Catalog {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await getSupabase()
      .from("products")
      .select(SELECT)
      .neq("menu", "catering")
      .eq("is_available", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(`Catalog load failed: ${error.message}`);
    return (data ?? []).map((r) => mapProduct(r as Row));
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await getSupabase()
      .from("products")
      .select(SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Product load failed: ${error.message}`);
    return data ? mapProduct(data as Row) : null;
  }

  async getProductsBySlugs(slugs: string[]): Promise<Product[]> {
    if (slugs.length === 0) return [];
    const { data, error } = await getSupabase()
      .from("products")
      .select(SELECT)
      .in("slug", slugs);
    if (error) throw new Error(`Products load failed: ${error.message}`);
    return (data ?? []).map((r) => mapProduct(r as Row));
  }

  async getCateringProducts(): Promise<Product[]> {
    const { data, error } = await getSupabase()
      .from("products")
      .select(SELECT)
      .eq("menu", "catering")
      .eq("is_available", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(`Catering catalog load failed: ${error.message}`);
    return (data ?? []).map((r) => mapProduct(r as Row));
  }
}

export const catalog: Catalog = new SupabaseCatalog();

// Convenience for the menu UI: products grouped by menu -> category, preserving
// sort order.
export function groupByMenu(products: Product[]): MenuGroup[] {
  const menus: MenuGroup[] = [];
  for (const p of products) {
    let menu = menus.find((m) => m.menu === p.menu);
    if (!menu) {
      menu = { menu: p.menu, categories: [] };
      menus.push(menu);
    }
    let cat = menu.categories.find((c) => c.category === p.category);
    if (!cat) {
      cat = { category: p.category, products: [] };
      menu.categories.push(cat);
    }
    cat.products.push(p);
  }
  return menus;
}
