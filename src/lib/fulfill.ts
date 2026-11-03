import "server-only";
import { query } from "./db";
import { getOrder } from "./repo";
import { deriveOrderStatus } from "./order-status";
import { statusAfterPayment } from "./fulfillment";
import { queueEmail } from "./email/outbox";
import {
  accessCodeEmail,
  orderConfirmationEmail,
  vendorDropShipEmail,
} from "./email/templates";
import type { ItemStatus, OrderWithItems } from "./types";

/**
 * Everything that happens once money has been taken. Deliberately independent
 * of the payment provider, so switching mock -> Stripe changes nothing here.
 */
export async function fulfillOrder(orderId: string, paymentRef: string) {
  const order = await getOrder(orderId);
  if (!order) throw new Error(`Order ${orderId} not found`);
  // Idempotent: a Stripe webhook and a redirect can both land.
  if (order.status !== "pending_payment") return order;

  for (const item of order.items) {
    const next = statusAfterPayment(item.fulfillment_type);
    const notifiedAt =
      item.fulfillment_type === "drop_shipping" ? new Date().toISOString() : null;

    await query(
      `update order_items set status=$2, vendor_notified_at=coalesce($3, vendor_notified_at), updated_at=now()
       where id=$1`,
      [item.id, next, notifiedAt]
    );
    item.status = next as ItemStatus;

    // Drop shipping: the vendor is emailed the order automatically.
    if (item.fulfillment_type === "drop_shipping" && item.vendor_email) {
      await queueEmail({
        to: item.vendor_email,
        template: "vendor_drop_ship",
        email: vendorDropShipEmail(order, item),
        payload: { order_number: order.order_number, item_id: item.id },
        orderId: order.id,
      });
    }
  }

  await queueEmail({
    to: order.customer_email,
    template: "order_confirmation",
    email: orderConfirmationEmail(order, order.items),
    payload: { order_number: order.order_number },
    orderId: order.id,
  });

  const status = deriveOrderStatus(order.items);
  await query(
    `update orders set status=$2, payment_ref=$3, updated_at=now() where id=$1`,
    [order.id, status, paymentRef]
  );

  return (await getOrder(order.id)) as OrderWithItems;
}

/** Move a single line item, then recompute the order-level status. */
export async function setItemStatus(
  itemId: string,
  status: ItemStatus,
  extra: { tracking_number?: string | null } = {}
) {
  await query(
    `update order_items set status=$2,
       tracking_number = coalesce($3, tracking_number),
       vendor_notified_at = case when $2 = 'forwarded_to_vendor' then now() else vendor_notified_at end,
       updated_at = now()
     where id=$1`,
    [itemId, status, extra.tracking_number ?? null]
  );
  await refreshOrderStatusForItem(itemId);
}

/** Store the access code, mark the line sent, and queue the delivery email. */
export async function sendAccessCode(itemId: string, code: string) {
  const rows = await query<{ order_id: string }>(
    `select order_id from order_items where id=$1`,
    [itemId]
  );
  const orderId = rows[0]?.order_id;
  if (!orderId) throw new Error("Order item not found");

  await query(
    `update order_items set access_code=$2, status='code_sent', updated_at=now() where id=$1`,
    [itemId, code]
  );

  const order = await getOrder(orderId);
  const item = order?.items.find((i) => i.id === itemId);
  if (order && item) {
    await queueEmail({
      to: order.customer_email,
      template: "access_code",
      email: accessCodeEmail(order, item, code),
      payload: { order_number: order.order_number, item_id: item.id },
      orderId: order.id,
    });
  }
  await refreshOrderStatusForItem(itemId);
}

/** Re-send the drop-ship order to the vendor. */
export async function resendVendorEmail(itemId: string) {
  const rows = await query<{ order_id: string }>(
    `select order_id from order_items where id=$1`,
    [itemId]
  );
  const order = rows[0] ? await getOrder(rows[0].order_id) : null;
  const item = order?.items.find((i) => i.id === itemId);
  if (!order || !item || !item.vendor_email) return;

  await queueEmail({
    to: item.vendor_email,
    template: "vendor_drop_ship",
    email: vendorDropShipEmail(order, item),
    payload: { order_number: order.order_number, item_id: item.id, resend: true },
    orderId: order.id,
  });
  await query(`update order_items set vendor_notified_at=now() where id=$1`, [itemId]);
}

async function refreshOrderStatusForItem(itemId: string) {
  const rows = await query<{ order_id: string }>(
    `select order_id from order_items where id=$1`,
    [itemId]
  );
  const orderId = rows[0]?.order_id;
  if (!orderId) return;
  const order = await getOrder(orderId);
  if (!order) return;
  await query(`update orders set status=$2, updated_at=now() where id=$1`, [
    orderId,
    deriveOrderStatus(order.items),
  ]);
}
