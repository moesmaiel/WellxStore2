"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getOrderItem } from "@/lib/repo";
import { nextStatuses } from "@/lib/fulfillment";
import { resendVendorEmail, sendAccessCode, setItemStatus } from "@/lib/fulfill";
import type { ItemStatus } from "@/lib/types";

async function guard() {
  await requireAdmin();
}

export type ActionResult = { error?: string };

/** Advance a single line item. Only transitions its own pipeline allows. */
export async function advanceItem(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await guard();
  const itemId = String(form.get("item_id") ?? "");
  const status = String(form.get("status") ?? "") as ItemStatus;
  const tracking = String(form.get("tracking_number") ?? "").trim();

  const item = await getOrderItem(itemId);
  if (!item) return { error: "Order item not found" };

  if (!nextStatuses(item.fulfillment_type, item.status).includes(status)) {
    return { error: `Cannot move from ${item.status} to ${status}` };
  }

  await setItemStatus(itemId, status, { tracking_number: tracking || null });
  revalidatePath(`/admin/orders/${item.order_id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return {};
}

/** Access code path: store the code, mark it sent, queue the email. */
export async function issueAccessCode(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await guard();
  const itemId = String(form.get("item_id") ?? "");
  const code = String(form.get("access_code") ?? "").trim();
  if (!code) return { error: "Enter an access code" };

  const item = await getOrderItem(itemId);
  if (!item) return { error: "Order item not found" };
  if (item.fulfillment_type !== "access_code") {
    return { error: "This item is not an access code product" };
  }

  await sendAccessCode(itemId, code);
  revalidatePath(`/admin/orders/${item.order_id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/emails");
  return {};
}

export async function resendToVendor(form: FormData): Promise<void> {
  await guard();
  const itemId = String(form.get("item_id") ?? "");
  const item = await getOrderItem(itemId);
  if (!item) return;
  await resendVendorEmail(itemId);
  revalidatePath(`/admin/orders/${item.order_id}`);
  revalidatePath("/admin/emails");
}
