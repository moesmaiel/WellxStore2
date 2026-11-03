import type { FulfillmentType, ItemStatus } from "./types";

/**
 * Single source of truth for how each fulfillment type behaves. The storefront
 * CTA, the cart guard, the post-payment branching and the admin status
 * dropdowns all read from here, so they cannot disagree.
 */

export const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  own_inventory: "Own Inventory",
  access_code: "Access Code",
  drop_shipping: "Drop Shipping",
  affiliate: "Affiliate",
};

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  code_pending: "Code Pending",
  code_sent: "Code Sent",
  forwarded_to_vendor: "Forwarded to Vendor",
  vendor_confirmed: "Vendor Confirmed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const ORDER_STATUS_LABELS = {
  pending_payment: "Pending Payment",
  paid: "Paid",
  partially_fulfilled: "Partially Fulfilled",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  refunded: "Refunded",
} as const;

/** Affiliate products are never added to a cart — they redirect to the partner. */
export function isCartable(type: FulfillmentType): boolean {
  return type !== "affiliate";
}

/** The happy-path pipeline for a line item, in order. */
export function statusFlow(type: FulfillmentType): ItemStatus[] {
  switch (type) {
    case "own_inventory":
      return ["pending_payment", "paid", "processing", "shipped", "delivered"];
    case "access_code":
      return ["pending_payment", "paid", "code_pending", "code_sent"];
    case "drop_shipping":
      return [
        "pending_payment",
        "paid",
        "forwarded_to_vendor",
        "vendor_confirmed",
        "shipped",
        "delivered",
      ];
    case "affiliate":
      // Tracked as a redemption log, not an order pipeline.
      return [];
  }
}

export const TERMINAL_EXITS: ItemStatus[] = ["cancelled", "refunded"];

/** True once the item needs no further action. */
export function isTerminal(type: FulfillmentType, status: ItemStatus): boolean {
  if (TERMINAL_EXITS.includes(status)) return true;
  const flow = statusFlow(type);
  return flow.length > 0 && status === flow[flow.length - 1];
}

/**
 * Statuses an admin may move this item to next: the following step in its own
 * pipeline, plus cancel/refund which are always available before completion.
 */
export function nextStatuses(
  type: FulfillmentType,
  current: ItemStatus
): ItemStatus[] {
  if (TERMINAL_EXITS.includes(current)) return [];
  const flow = statusFlow(type);
  const idx = flow.indexOf(current);
  const forward = idx >= 0 && idx < flow.length - 1 ? [flow[idx + 1]] : [];
  return [...forward, ...TERMINAL_EXITS];
}

/** The status an item lands on the moment payment succeeds. */
export function statusAfterPayment(type: FulfillmentType): ItemStatus {
  switch (type) {
    case "own_inventory":
      return "processing";
    case "access_code":
      return "code_pending";
    case "drop_shipping":
      return "forwarded_to_vendor";
    case "affiliate":
      return "paid";
  }
}

export type Cta = {
  kind: "add_to_cart" | "affiliate";
  label: string;
  /** Shown under the button to set expectations before purchase. */
  note?: string;
};

export function ctaFor(type: FulfillmentType): Cta {
  switch (type) {
    case "own_inventory":
      return { kind: "add_to_cart", label: "Add to Cart", note: "Ships in 3–5 business days." };
    case "access_code":
      return {
        kind: "add_to_cart",
        label: "Add to Cart",
        note: "Your access code is emailed after purchase.",
      };
    case "drop_shipping":
      return {
        kind: "add_to_cart",
        label: "Add to Cart",
        note: "Fulfilled directly by our partner.",
      };
    case "affiliate":
      return { kind: "affiliate", label: "Get the code", note: "Purchase completes on the partner's site." };
  }
}

/** Per-item message on the order confirmation, so mixed orders read clearly. */
export function confirmationLine(type: FulfillmentType, productName: string): string {
  switch (type) {
    case "own_inventory":
      return `Your ${productName} will ship in 3–5 business days.`;
    case "access_code":
      return `Your access code for ${productName} will be emailed separately.`;
    case "drop_shipping":
      return `Your ${productName} order has been sent to our fulfillment partner, who will contact you to arrange delivery.`;
    case "affiliate":
      return `${productName} is redeemed on the partner's site.`;
  }
}

/** Tailwind classes for the status chip. */
export function statusTone(status: ItemStatus): string {
  if (status === "cancelled" || status === "refunded")
    return "bg-red-50 text-red-700 ring-red-200";
  if (status === "delivered" || status === "code_sent")
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (status === "pending_payment")
    return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-violet-50 text-violet-700 ring-violet-200";
}
