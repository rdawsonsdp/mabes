"use server";

import { cartStore } from "./store";
import { getSessionId, getOrCreateSessionId } from "./session";
import { UserError } from "./errors";
import { EMPTY_CART, type Cart, type AddToCartInput } from "../types";

// Server Actions are the only entry point the browser has to the cart. Each one
// resolves the session from the httpOnly cookie, never trusting a client-sent
// id, and returns the fresh Cart so the client can replace its state.

export type CartResult = { ok: true; cart: Cart } | { ok: false; error: string };
export type CheckoutResult =
  | { ok: true; orderNumber: number; totalCents: number }
  | { ok: false; error: string };

// Only surface messages we authored (UserError); genericize everything else so
// raw Supabase/Postgres details (codes, column/constraint names) never reach the
// browser. The real error is logged server-side.
function fail(e: unknown): { ok: false; error: string } {
  if (e instanceof UserError) return { ok: false, error: e.message };
  console.error("[cart] action error:", e);
  return { ok: false, error: "Something went wrong. Please try again." };
}

export async function getCartAction(): Promise<Cart> {
  const sessionId = await getSessionId();
  if (!sessionId) return EMPTY_CART;
  try {
    return await cartStore.getCart(sessionId);
  } catch {
    return EMPTY_CART;
  }
}

export async function addToCartAction(input: AddToCartInput): Promise<CartResult> {
  try {
    const sessionId = await getOrCreateSessionId();
    const cart = await cartStore.addItem(sessionId, {
      productId: input.productId,
      variantId: input.variantId ?? null,
      modifierIds: Array.isArray(input.modifierIds) ? input.modifierIds : [],
      quantity: Number(input.quantity) || 1,
      notes: input.notes ?? null,
    });
    return { ok: true, cart };
  } catch (e) {
    return fail(e);
  }
}

export async function updateQuantityAction(
  itemId: string,
  quantity: number
): Promise<CartResult> {
  try {
    const qty = Number(quantity);
    if (!Number.isFinite(qty)) return fail(new UserError("Invalid quantity."));
    const sessionId = await getOrCreateSessionId();
    const cart = await cartStore.updateItemQuantity(sessionId, itemId, qty);
    return { ok: true, cart };
  } catch (e) {
    return fail(e);
  }
}

export async function removeItemAction(itemId: string): Promise<CartResult> {
  try {
    const sessionId = await getOrCreateSessionId();
    const cart = await cartStore.removeItem(sessionId, itemId);
    return { ok: true, cart };
  } catch (e) {
    return fail(e);
  }
}

export async function clearCartAction(): Promise<CartResult> {
  try {
    const sessionId = await getOrCreateSessionId();
    const cart = await cartStore.clear(sessionId);
    return { ok: true, cart };
  } catch (e) {
    return fail(e);
  }
}

export async function checkoutAction(): Promise<CheckoutResult> {
  try {
    const sessionId = await getOrCreateSessionId();
    const { orderNumber, totalCents } = await cartStore.checkout(sessionId);
    return { ok: true, orderNumber, totalCents };
  } catch (e) {
    return fail(e);
  }
}
