import { getSupabase } from "../supabase/server";
import { catalog } from "../catalog/catalog";
import { type Cart, type CartItem, type AddToCartInput, EMPTY_CART } from "../types";
import { resolveSelection, lineSignature } from "./pricing";
import { UserError } from "./errors";

const MAX_QTY = 99;
const MAX_NOTES = 280;
const PG_UNIQUE_VIOLATION = "23505";

// Cart persistence. Interface-first so the Supabase adapter below can be swapped
// (e.g. for a Clover-backed order draft) without changing the server actions.
export interface CartStore {
  getCart(sessionId: string): Promise<Cart>;
  addItem(sessionId: string, input: AddToCartInput): Promise<Cart>;
  updateItemQuantity(sessionId: string, itemId: string, quantity: number): Promise<Cart>;
  removeItem(sessionId: string, itemId: string): Promise<Cart>;
  clear(sessionId: string): Promise<Cart>;
  checkout(
    sessionId: string
  ): Promise<{ orderId: string; orderNumber: number; totalCents: number }>;
}

const CART_SELECT = `
  id,
  cart_items (
    id, product_id, variant_id, quantity, unit_price_cents,
    name_snapshot, image_snapshot, variant_name_snapshot, notes, created_at,
    products ( slug ),
    cart_item_modifiers ( modifier_id, name_snapshot, price_cents )
  )
`;

type Row = Record<string, unknown>;
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const clampQty = (q: number) => Math.max(1, Math.min(MAX_QTY, Math.floor(q)));

function mapCart(row: Row | null): Cart {
  if (!row) return EMPTY_CART;
  const rawItems = ((row.cart_items as Row[]) ?? []).slice().sort((a, b) =>
    String(a.created_at).localeCompare(String(b.created_at))
  );
  const items: CartItem[] = rawItems.map((r) => {
    const quantity = num(r.quantity);
    const unitPriceCents = num(r.unit_price_cents);
    const product = r.products as Row | null;
    return {
      id: String(r.id),
      productId: String(r.product_id),
      productSlug: product ? String(product.slug) : "",
      name: String(r.name_snapshot),
      image: (r.image_snapshot as string) ?? null,
      variantId: (r.variant_id as string) ?? null,
      variantName: (r.variant_name_snapshot as string) ?? null,
      quantity,
      unitPriceCents,
      lineTotalCents: unitPriceCents * quantity,
      modifiers: ((r.cart_item_modifiers as Row[]) ?? []).map((m) => ({
        modifierId: (m.modifier_id as string) ?? "",
        name: String(m.name_snapshot),
        priceCents: num(m.price_cents),
      })),
      notes: (r.notes as string) ?? null,
    };
  });
  return {
    id: String(row.id),
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotalCents: items.reduce((n, i) => n + i.lineTotalCents, 0),
  };
}

class SupabaseCartStore implements CartStore {
  /** Returns the open cart row id for a session, or null if none exists. */
  private async findOpenCartId(sessionId: string): Promise<string | null> {
    const { data, error } = await getSupabase()
      .from("carts")
      .select("id")
      .eq("session_id", sessionId)
      .eq("status", "open")
      .maybeSingle();
    if (error) throw new Error(`Cart lookup failed: ${error.message}`);
    return data ? String(data.id) : null;
  }

  private async getOrCreateCartId(sessionId: string): Promise<string> {
    const existing = await this.findOpenCartId(sessionId);
    if (existing) return existing;
    const { data, error } = await getSupabase()
      .from("carts")
      .insert({ session_id: sessionId, status: "open" })
      .select("id")
      .single();
    if (error) {
      // Concurrent first-add: another request created the open cart between our
      // lookup and insert (the partial unique index on open carts rejects the
      // duplicate). Re-read instead of failing the user's action.
      if (error.code === PG_UNIQUE_VIOLATION) {
        const again = await this.findOpenCartId(sessionId);
        if (again) return again;
      }
      throw new Error(`Cart create failed: ${error.message}`);
    }
    return String(data.id);
  }

  private async loadCartByItsId(cartId: string): Promise<Cart> {
    const { data, error } = await getSupabase()
      .from("carts")
      .select(CART_SELECT)
      .eq("id", cartId)
      .maybeSingle();
    if (error) throw new Error(`Cart load failed: ${error.message}`);
    return mapCart(data as Row | null);
  }

  async getCart(sessionId: string): Promise<Cart> {
    const { data, error } = await getSupabase()
      .from("carts")
      .select(CART_SELECT)
      .eq("session_id", sessionId)
      .eq("status", "open")
      .maybeSingle();
    if (error) throw new Error(`Cart load failed: ${error.message}`);
    return mapCart(data as Row | null);
  }

  async addItem(sessionId: string, input: AddToCartInput): Promise<Cart> {
    const product = await catalog.getProductById(input.productId);
    if (!product || !product.isAvailable) {
      throw new UserError("That item is no longer available.");
    }
    const { variant, modifiers, unitPriceCents } = resolveSelection(
      product,
      input.variantId,
      input.modifierIds
    );
    const quantity = clampQty(input.quantity);
    // Cap server-side too — the client maxLength can be bypassed by calling the
    // Server Action directly.
    const notes = input.notes?.trim().slice(0, MAX_NOTES) || null;
    const supabase = getSupabase();
    const cartId = await this.getOrCreateCartId(sessionId);

    // Merge into an identical existing line if present. NOTE: this read-merge-
    // write is not atomic, so two *simultaneous* identical adds could create a
    // duplicate line or miss a +1. In practice both add entry points disable
    // their button while in flight, and the cart is an editable draft, so the
    // window is tiny. Before Clover/payment, move this into an upsert keyed by a
    // line-signature column (insert ... on conflict do update set quantity = ...).
    const current = await this.loadCartByItsId(cartId);
    const sig = lineSignature(
      product.id,
      variant?.id ?? null,
      modifiers.map((m) => m.id),
      notes
    );
    const match = current.items.find(
      (it) =>
        lineSignature(
          it.productId,
          it.variantId,
          it.modifiers.map((m) => m.modifierId),
          it.notes
        ) === sig
    );
    if (match) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: clampQty(match.quantity + quantity) })
        .eq("id", match.id)
        .eq("cart_id", cartId);
      if (error) throw new Error(`Add to bag failed: ${error.message}`);
      return this.loadCartByItsId(cartId);
    }

    const { data: itemRow, error: itemErr } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cartId,
        product_id: product.id,
        variant_id: variant?.id ?? null,
        quantity,
        unit_price_cents: unitPriceCents,
        name_snapshot: product.name,
        image_snapshot: product.image,
        variant_name_snapshot: variant?.name ?? null,
        notes,
      })
      .select("id")
      .single();
    if (itemErr) throw new Error(`Add to bag failed: ${itemErr.message}`);

    if (modifiers.length > 0) {
      const { error: modErr } = await supabase.from("cart_item_modifiers").insert(
        modifiers.map((m) => ({
          cart_item_id: itemRow.id,
          modifier_id: m.id,
          name_snapshot: m.name,
          price_cents: m.priceCents,
        }))
      );
      if (modErr) throw new Error(`Add to bag failed: ${modErr.message}`);
    }
    return this.loadCartByItsId(cartId);
  }

  async updateItemQuantity(sessionId: string, itemId: string, quantity: number): Promise<Cart> {
    const cartId = await this.findOpenCartId(sessionId);
    if (!cartId) return EMPTY_CART;
    if (quantity <= 0) return this.removeItem(sessionId, itemId);
    const { error } = await getSupabase()
      .from("cart_items")
      .update({ quantity: clampQty(quantity) })
      .eq("id", itemId)
      .eq("cart_id", cartId);
    if (error) throw new Error(`Update failed: ${error.message}`);
    return this.loadCartByItsId(cartId);
  }

  async removeItem(sessionId: string, itemId: string): Promise<Cart> {
    const cartId = await this.findOpenCartId(sessionId);
    if (!cartId) return EMPTY_CART;
    const { error } = await getSupabase()
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("cart_id", cartId);
    if (error) throw new Error(`Remove failed: ${error.message}`);
    return this.loadCartByItsId(cartId);
  }

  async clear(sessionId: string): Promise<Cart> {
    const cartId = await this.findOpenCartId(sessionId);
    if (!cartId) return EMPTY_CART;
    const { error } = await getSupabase().from("cart_items").delete().eq("cart_id", cartId);
    if (error) throw new Error(`Clear failed: ${error.message}`);
    return this.loadCartByItsId(cartId);
  }

  async checkout(
    sessionId: string
  ): Promise<{ orderId: string; orderNumber: number; totalCents: number }> {
    // The order (header + items + modifiers + cart close) is built atomically
    // inside a single Postgres transaction with a row lock — see the
    // checkout_cart() RPC. This prevents partial/orphaned orders and makes a
    // duplicate/concurrent checkout safe (the second one finds no open cart).
    const { data, error } = await getSupabase()
      .rpc("checkout_cart", { p_session_id: sessionId })
      .single<{ order_id: string; order_number: number; total_cents: number }>();
    if (error) {
      if (error.message?.includes("CART_EMPTY")) {
        throw new UserError("Your bag is empty.");
      }
      throw new Error(`Checkout failed: ${error.message}`);
    }
    if (!data) throw new UserError("Your bag is empty.");
    return {
      orderId: String(data.order_id),
      orderNumber: num(data.order_number),
      totalCents: num(data.total_cents),
    };
  }
}

export const cartStore: CartStore = new SupabaseCartStore();
