import type { FulfillmentType, ItemStatus, OrderStatus } from "./types";
import { isTerminal, TERMINAL_EXITS } from "./fulfillment";

type StatusBearing = { fulfillment_type: FulfillmentType; status: ItemStatus };

/**
 * Order-level status is always derived from the line items, so an order
 * containing a shipped device and a pending access code reads
 * "Partially Fulfilled" rather than claiming to be done.
 */
export function deriveOrderStatus(items: StatusBearing[]): OrderStatus {
  if (items.length === 0) return "pending_payment";

  const active = items.filter((i) => !TERMINAL_EXITS.includes(i.status));

  // Every line cancelled or refunded — the order as a whole is too.
  if (active.length === 0) {
    return items.every((i) => i.status === "refunded") ? "refunded" : "cancelled";
  }

  if (active.every((i) => i.status === "pending_payment")) return "pending_payment";
  if (active.some((i) => i.status === "pending_payment")) return "pending_payment";

  const done = active.filter((i) => isTerminal(i.fulfillment_type, i.status));
  if (done.length === active.length) return "fulfilled";
  if (done.length > 0) return "partially_fulfilled";
  return "paid";
}
