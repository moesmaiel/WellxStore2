import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getOrder } from "@/lib/repo";
import { formatMoney } from "@/lib/pricing";
import { confirmationLine, FULFILLMENT_LABELS } from "@/lib/fulfillment";
import { ProductImage } from "@/components/store/ProductImage";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage(
  props: PageProps<"/order/[orderNumber]">
) {
  const { orderNumber } = await props.params;
  const order = await getOrder(orderNumber);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-wx-line bg-white p-6 sm:p-8">
        <CheckCircle2 className="text-emerald-500" size={40} aria-hidden="true" />
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
          Thanks, {order.customer_name.split(" ")[0]} — your order is confirmed
        </h1>
        <p className="mt-2 text-neutral-600">
          Order <strong className="text-wx-ink">{order.order_number}</strong>. A
          confirmation is on its way to {order.customer_email}.
        </p>

        {/* Mixed orders are the norm here, so say plainly what happens to each item. */}
        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-wx-muted">
            What happens next
          </h2>
          <ul className="mt-4 space-y-4">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex gap-4 rounded-2xl border border-wx-line p-4"
              >
                <ProductImage
                  src={item.product_snapshot.image}
                  alt={item.product_snapshot.name}
                  initials={item.product_snapshot.brand_name ?? item.product_snapshot.name}
                  className="h-16 w-16 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold">
                      {item.product_snapshot.name}
                      <span className="font-normal text-wx-muted"> × {item.quantity}</span>
                    </p>
                    <p className="font-semibold">
                      {formatMoney(item.unit_wellx_price * item.quantity, order.currency)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {confirmationLine(item.fulfillment_type, item.product_snapshot.name)}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-wx-bg px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-wx-purple">
                    {FULFILLMENT_LABELS[item.fulfillment_type]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-wx-line pt-6">
          <span className="font-bold">Total paid</span>
          <span className="text-2xl font-extrabold wx-gradient-text">
            {formatMoney(order.total, order.currency)}
          </span>
        </div>

        <Link
          href="/shop"
          className="wx-focus mt-8 inline-block rounded-full wx-gradient px-7 py-3.5 font-semibold text-white transition hover:opacity-90"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
