import { NextResponse } from "next/server";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { getProductsByIds, getSettings } from "@/lib/repo";
import { isCartable } from "@/lib/fulfillment";
import { cartTotals } from "@/lib/pricing";
import { newOrderNumber } from "@/lib/order-number";
import { paymentProvider } from "@/lib/payments";
import { fulfillOrder } from "@/lib/fulfill";

const CheckoutSchema = z.object({
  customer_name: z.string().trim().min(1, "Name is required").max(120),
  customer_email: z.email("Enter a valid email"),
  customer_phone: z.string().trim().max(40).optional().or(z.literal("")),
  shipping_address: z.object({
    line1: z.string().trim().min(1, "Address is required").max(200),
    line2: z.string().trim().max(200).optional().or(z.literal("")),
    city: z.string().trim().min(1, "City is required").max(100),
    state: z.string().trim().max(100).optional().or(z.literal("")),
    postal_code: z.string().trim().max(30).optional().or(z.literal("")),
    country: z.string().trim().min(1, "Country is required").max(100),
  }),
  lines: z
    .array(
      z.object({
        productId: z.uuid(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Your cart is empty"),
});

export async function POST(request: Request) {
  const parsed = CheckoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid details" },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // 1. Re-validate every line against the database. Client prices are ignored.
  const settings = await getSettings();
  const products = await getProductsByIds(input.lines.map((l) => l.productId));

  const lines = input.lines.flatMap((l) => {
    const p = products.find((x) => x.id === l.productId);
    if (!p || !p.is_active) return [];
    if (!isCartable(p.fulfillment_type)) return []; // affiliate never reaches an order
    if (
      p.fulfillment_type === "own_inventory" &&
      p.stock_qty !== null &&
      p.stock_qty < l.quantity
    )
      return [];
    return [{ product: p, quantity: l.quantity }];
  });

  if (lines.length === 0) {
    return NextResponse.json(
      { error: "None of the items in your cart are available to purchase." },
      { status: 409 }
    );
  }

  const totals = cartTotals(
    lines.map((l) => ({
      unit_regular_price: l.product.regular_price,
      unit_wellx_price: l.product.wellx_price,
      unit_commission: l.product.commission,
      quantity: l.quantity,
    }))
  );
  const currency = lines[0].product.currency ?? settings.default_currency;

  // 2. Create the order and its line items, snapshotting each product.
  const order = await queryOne<{ id: string; order_number: string }>(
    `insert into orders (order_number, customer_name, customer_email, customer_phone,
                         shipping_address, currency, subtotal, total, status, payment_provider)
     values ($1,$2,$3,$4,$5,$6,$7,$8,'pending_payment',$9)
     returning id, order_number`,
    [
      newOrderNumber(),
      input.customer_name,
      input.customer_email,
      input.customer_phone || null,
      JSON.stringify(input.shipping_address),
      currency,
      totals.subtotal,
      totals.total,
      paymentProvider().name,
    ]
  );
  if (!order) throw new Error("Failed to create order");

  for (const { product: p, quantity } of lines) {
    await query(
      `insert into order_items (order_id, product_id, product_snapshot, quantity,
         unit_regular_price, unit_wellx_price, unit_commission, fulfillment_type,
         status, vendor_email)
       values ($1,$2,$3,$4,$5,$6,$7,$8,'pending_payment',$9)`,
      [
        order.id,
        p.id,
        JSON.stringify({
          name: p.name,
          slug: p.slug,
          brand_name: p.brand?.name ?? null,
          image: p.images[0] ?? null,
          tagline: p.tagline,
        }),
        quantity,
        p.regular_price,
        p.wellx_price,
        p.commission,
        p.fulfillment_type,
        p.vendor_email,
      ]
    );
  }

  // 3. Take payment.
  const intent = await paymentProvider().createIntent({
    id: order.id,
    order_number: order.order_number,
    total: totals.total,
    currency,
    customer_email: input.customer_email,
  });

  // 4. A provider that settles inline (mock) fulfills straight away. A redirect
  //    provider (Stripe) returns its URL and fulfillment happens on confirm.
  if (intent.settled) {
    await fulfillOrder(order.id, intent.ref);
    return NextResponse.json({
      orderNumber: order.order_number,
      redirectUrl: `/order/${order.order_number}`,
    });
  }

  await query(`update orders set payment_ref=$2 where id=$1`, [order.id, intent.ref]);
  return NextResponse.json({
    orderNumber: order.order_number,
    redirectUrl: intent.redirectUrl,
  });
}
