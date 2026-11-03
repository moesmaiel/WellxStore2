import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { paymentProvider } from "@/lib/payments";
import { fulfillOrder } from "@/lib/fulfill";

/**
 * Return leg for redirect-based providers. The mock provider settles inline in
 * /api/checkout and never reaches here; Stripe will land here (and, once the
 * webhook is added, there too — fulfillOrder is idempotent).
 */
export async function GET(request: Request) {
  const ref = new URL(request.url).searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });

  const order = await queryOne<{ id: string; order_number: string }>(
    `select id, order_number from orders where payment_ref = $1`,
    [ref]
  );
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const confirmation = await paymentProvider().confirm(ref);
  if (!confirmation.paid) {
    return NextResponse.redirect(new URL(`/checkout?failed=1`, request.url));
  }

  await fulfillOrder(order.id, ref);
  return NextResponse.redirect(new URL(`/order/${order.order_number}`, request.url));
}
