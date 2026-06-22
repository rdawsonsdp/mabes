"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { Cart, AddToCartInput } from "@/app/lib/types";
import { EMPTY_CART } from "@/app/lib/types";
import {
  getCartAction,
  addToCartAction,
  updateQuantityAction,
  removeItemAction,
  clearCartAction,
  checkoutAction,
  type CheckoutResult,
} from "@/app/lib/cart/actions";

type CartContextValue = {
  cart: Cart;
  isOpen: boolean;
  pending: boolean;
  error: string | null;
  clearError: () => void;
  openCart: () => void;
  closeCart: () => void;
  addItem: (input: AddToCartInput) => Promise<{ ok: boolean; error?: string }>;
  updateQty: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clear: () => void;
  checkout: () => Promise<CheckoutResult>;
};

const CartContext = createContext<CartContextValue | null>(null);

const MAX_QTY = 99;

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

// Recompute the derived totals after an optimistic line change.
function recalc(cart: Cart): Cart {
  const items = cart.items.map((i) => ({
    ...i,
    lineTotalCents: i.unitPriceCents * i.quantity,
  }));
  return {
    ...cart,
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotalCents: items.reduce((n, i) => n + i.lineTotalCents, 0),
  };
}

export function CartProvider({
  initialCart,
  children,
}: {
  initialCart: Cart;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<Cart>(initialCart ?? EMPTY_CART);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const clearError = useCallback(() => setError(null), []);

  // Add resolves so callers (the options modal) can surface validation errors
  // and close themselves only on success. On success we pop the drawer open.
  const addItem = useCallback(async (input: AddToCartInput) => {
    const res = await addToCartAction(input);
    if (res.ok) {
      setCart(res.cart);
      setError(null);
      setIsOpen(true);
      return { ok: true };
    }
    return { ok: false, error: res.error };
  }, []);

  // Mutations apply optimistically (instant UI, consecutive clicks compound),
  // then reconcile with the server's authoritative cart. On failure we surface
  // the error and resync from the server so the UI never silently diverges.
  const updateQty = useCallback((itemId: string, quantity: number) => {
    setError(null);
    setCart((prev) =>
      recalc({
        ...prev,
        items:
          quantity <= 0
            ? prev.items.filter((i) => i.id !== itemId)
            : prev.items.map((i) =>
                i.id === itemId ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i
              ),
      })
    );
    startTransition(async () => {
      const res = await updateQuantityAction(itemId, quantity);
      if (res.ok) setCart(res.cart);
      else {
        setError(res.error);
        setCart(await getCartAction());
      }
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setError(null);
    setCart((prev) => recalc({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }));
    startTransition(async () => {
      const res = await removeItemAction(itemId);
      if (res.ok) setCart(res.cart);
      else {
        setError(res.error);
        setCart(await getCartAction());
      }
    });
  }, []);

  const clear = useCallback(() => {
    setError(null);
    setCart((prev) => recalc({ ...prev, items: [] }));
    startTransition(async () => {
      const res = await clearCartAction();
      if (res.ok) setCart(res.cart);
      else {
        setError(res.error);
        setCart(await getCartAction());
      }
    });
  }, []);

  const checkout = useCallback(async () => {
    const res = await checkoutAction();
    if (res.ok) setCart(EMPTY_CART);
    return res;
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isOpen,
      pending,
      error,
      clearError,
      openCart,
      closeCart,
      addItem,
      updateQty,
      removeItem,
      clear,
      checkout,
    }),
    [cart, isOpen, pending, error, clearError, openCart, closeCart, addItem, updateQty, removeItem, clear, checkout]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
