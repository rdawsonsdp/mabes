import type { ModifierGroup } from "@/app/lib/types";
import { formatCents } from "@/app/lib/money";
import {
  CATERING_MINIMUM_CENTS,
  CATERING_LEAD_TIME_DAYS,
  meetsMinimum,
  earliestEventDate,
} from "./config";
import type { CateringCartState } from "./types";

export type ValidationResult = { ok: boolean; message: string | null };

const OK: ValidationResult = { ok: true, message: null };

export function validateMinimum(subtotalCents: number): ValidationResult {
  if (meetsMinimum(subtotalCents)) return OK;
  const shortfall = CATERING_MINIMUM_CENTS - subtotalCents;
  return {
    ok: false,
    message: `Catering orders have a ${formatCents(CATERING_MINIMUM_CENTS)} minimum. Add ${formatCents(
      shortfall
    )} more to continue.`,
  };
}

export function validateLeadTime(eventDate: string | null, now: Date = new Date()): ValidationResult {
  if (!eventDate) {
    return { ok: false, message: "Please choose an event date." };
  }
  const earliest = earliestEventDate(now);
  if (eventDate < earliest) {
    return {
      ok: false,
      message: `We need at least ${CATERING_LEAD_TIME_DAYS} days' notice. The earliest available date is ${earliest}.`,
    };
  }
  return OK;
}

/** Enforces a group's min/max. With min=max=2 this is the tray "pick exactly 2" rule. */
export function validateModifierGroup(group: ModifierGroup, selectedCount: number): ValidationResult {
  const min = group.minSelect;
  const max = group.maxSelect;
  if (selectedCount < min) {
    if (max != null && min === max) {
      return { ok: false, message: `Please select exactly ${min} for "${group.name}".` };
    }
    return { ok: false, message: `Please select at least ${min} for "${group.name}".` };
  }
  if (max != null && selectedCount > max) {
    if (min === max) {
      return { ok: false, message: `Please select exactly ${max} for "${group.name}".` };
    }
    return { ok: false, message: `Please select no more than ${max} for "${group.name}".` };
  }
  return OK;
}

export function validateModifierSelection(
  groups: ModifierGroup[],
  selectedIds: Set<string>
): { ok: boolean; byGroup: Record<string, ValidationResult> } {
  const byGroup: Record<string, ValidationResult> = {};
  let ok = true;
  for (const g of groups) {
    const count = g.modifiers.filter((m) => selectedIds.has(m.id)).length;
    const res = validateModifierGroup(g, count);
    byGroup[g.id] = res;
    if (!res.ok) ok = false;
  }
  return { ok, byGroup };
}

/** Aggregate gate for the cart drawer's "Proceed to checkout" button. */
export function canCheckout(state: CateringCartState, now: Date = new Date()): ValidationResult {
  if (state.items.length === 0) return { ok: false, message: "Your catering order is empty." };
  const min = validateMinimum(state.subtotalCents);
  if (!min.ok) return min;
  const lead = validateLeadTime(state.eventDate, now);
  if (!lead.ok) return lead;
  return OK;
}
