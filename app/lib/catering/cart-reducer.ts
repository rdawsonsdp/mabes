import type {
  CateringCartState,
  CateringCartAction,
  CateringCartItem,
  SelectedModifier,
} from "./types";

export const MAX_CATERING_QTY = 99;

/** Stable client-side line id. Extracted so tests can stub it deterministically. */
export function newLineId(): string {
  return crypto.randomUUID();
}

// Recompute every derived total after a line change.
export function recompute(state: CateringCartState): CateringCartState {
  const items = state.items.map((i) => ({
    ...i,
    lineTotalCents: i.unitPriceCents * i.quantity,
  }));
  return {
    ...state,
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotalCents: items.reduce((n, i) => n + i.lineTotalCents, 0),
  };
}

// Two add requests collapse onto one line only when the exact configuration
// matches (same product, same modifier ids, same notes).
function sameConfig(
  a: Pick<CateringCartItem, "productId" | "notes" | "selectedModifiers">,
  b: Omit<CateringCartItem, "lineId" | "lineTotalCents">
): boolean {
  if (a.productId !== b.productId) return false;
  if ((a.notes ?? "") !== (b.notes ?? "")) return false;
  const key = (m: SelectedModifier[]) =>
    m.map((x) => x.modifierId).sort().join("|");
  return key(a.selectedModifiers) === key(b.selectedModifiers);
}

export function cateringCartReducer(
  state: CateringCartState,
  action: CateringCartAction
): CateringCartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => sameConfig(i, action.item));
      if (existing) {
        return recompute({
          ...state,
          items: state.items.map((i) =>
            i.lineId === existing.lineId
              ? { ...i, quantity: Math.min(MAX_CATERING_QTY, i.quantity + action.item.quantity) }
              : i
          ),
        });
      }
      const item: CateringCartItem = {
        ...action.item,
        lineId: newLineId(),
        quantity: Math.min(MAX_CATERING_QTY, action.item.quantity),
        lineTotalCents: 0, // set by recompute
      };
      return recompute({ ...state, items: [...state.items, item] });
    }

    case "UPDATE_QTY": {
      if (action.quantity <= 0) {
        return recompute({
          ...state,
          items: state.items.filter((i) => i.lineId !== action.lineId),
        });
      }
      return recompute({
        ...state,
        items: state.items.map((i) =>
          i.lineId === action.lineId
            ? { ...i, quantity: Math.min(MAX_CATERING_QTY, action.quantity) }
            : i
        ),
      });
    }

    case "REMOVE_ITEM":
      return recompute({
        ...state,
        items: state.items.filter((i) => i.lineId !== action.lineId),
      });

    case "SET_FULFILLMENT":
      return { ...state, fulfillmentType: action.fulfillmentType };

    case "SET_EVENT":
      return { ...state, eventDate: action.eventDate, eventTime: action.eventTime };

    case "CLEAR":
      return recompute({ ...state, items: [] });

    case "HYDRATE":
      return recompute(action.state);

    default:
      return state;
  }
}
