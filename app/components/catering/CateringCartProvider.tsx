"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { cateringCartReducer } from "@/app/lib/catering/cart-reducer";
import {
  EMPTY_CATERING_CART,
  type CateringCartState,
  type CateringCartItem,
  type FulfillmentType,
} from "@/app/lib/catering/types";

export const CATERING_STORAGE_KEY = "mabes-catering-cart";

type CateringCartContextValue = {
  state: CateringCartState;
  isOpen: boolean;
  hydrated: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CateringCartItem, "lineId" | "lineTotalCents">) => void;
  updateQty: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
  setFulfillment: (fulfillmentType: FulfillmentType) => void;
  setEvent: (eventDate: string | null, eventTime: string | null) => void;
};

const CateringCartContext = createContext<CateringCartContextValue | null>(null);

export function useCateringCart(): CateringCartContextValue {
  const ctx = useContext(CateringCartContext);
  if (!ctx) throw new Error("useCateringCart must be used within <CateringCartProvider>");
  return ctx;
}

function loadState(): CateringCartState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CATERING_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CateringCartState) : null;
  } catch {
    return null;
  }
}

export function CateringCartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cateringCartReducer, EMPTY_CATERING_CART);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from sessionStorage once on mount (client-only cart).
  useEffect(() => {
    const saved = loadState();
    if (saved && (saved.items.length > 0 || saved.eventDate)) {
      dispatch({ type: "HYDRATE", state: saved });
    }
    setHydrated(true);
  }, []);

  // Persist after every change once hydrated.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(CATERING_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage may be full / disabled — non-fatal
    }
  }, [state, hydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((item: Omit<CateringCartItem, "lineId" | "lineTotalCents">) => {
    dispatch({ type: "ADD_ITEM", item });
    setIsOpen(true);
  }, []);

  const updateQty = useCallback((lineId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QTY", lineId, quantity });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    dispatch({ type: "REMOVE_ITEM", lineId });
  }, []);

  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const setFulfillment = useCallback(
    (fulfillmentType: FulfillmentType) => dispatch({ type: "SET_FULFILLMENT", fulfillmentType }),
    []
  );

  const setEvent = useCallback(
    (eventDate: string | null, eventTime: string | null) =>
      dispatch({ type: "SET_EVENT", eventDate, eventTime }),
    []
  );

  const value = useMemo<CateringCartContextValue>(
    () => ({
      state,
      isOpen,
      hydrated,
      openCart,
      closeCart,
      addItem,
      updateQty,
      removeItem,
      clear,
      setFulfillment,
      setEvent,
    }),
    [state, isOpen, hydrated, openCart, closeCart, addItem, updateQty, removeItem, clear, setFulfillment, setEvent]
  );

  return <CateringCartContext.Provider value={value}>{children}</CateringCartContext.Provider>;
}
