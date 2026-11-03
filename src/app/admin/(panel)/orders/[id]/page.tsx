import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOrder } from "@/lib/repo";
import { PageHeader, Card, Chip } from "@/components/admin/ui";
import { formatMoney } from "@/lib/pricing";
import { ORDER_STATUS_LABELS } from "@/lib/fulfillment";
import { OrderItemCard } from "./OrderItemCard";
import { orderTone } from "../page";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const order = await getOrder(id);
  if (!order) notFound();

  const a = order.shipping_address;
  const commission = order.items.reduce(
    (sum, i) => sum + i.unit_commission * i.quantity,
    0
  );

  return (
    <>
      <Link
        href="/admin/orders"
        className="wx-focus mb-4 inline-flex items-center gap-1.5 rounded text-sm text-wx-muted hover:text-wx-ink"
      >
        <ArrowLeft size={14} aria-hidden="true" /> All orders
      </Link>

      <PageHeader
        title={order.order_number}
        subtitle={`Placed ${new Date(order.created_at).toLocaleString("en-GB")}`}
        action={<Chip tone={orderTone(order.status)}>{ORDER_STATUS_LABELS[order.status]}</Chip>}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-wx-muted">
            Line items ({order.items.length})
          </h2>
          {order.items.map((item) => (
            <OrderItemCard key={item.id} item={item} currency={order.currency} />
          ))}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-8 lg:h-fit">
          <Card className="p-5">
            <h2 className="mb-3 font-bold">Customer</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Name" value={order.customer_name} />
              <Row label="Email" value={order.customer_email} />
              <Row label="Phone" value={order.customer_phone ?? "—"} />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-bold">Shipping address</h2>
            <address className="text-sm not-italic leading-relaxed text-neutral-700">
              {[a?.line1, a?.line2, a?.city, a?.state, a?.postal_code, a?.country]
                .filter(Boolean)
                .map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
            </address>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-bold">Payment</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Total" value={formatMoney(order.total, order.currency)} />
              <Row label="Provider" value={order.payment_provider ?? "—"} />
              <Row label="Reference" value={order.payment_ref ?? "—"} />
              <div className="border-t border-wx-line pt-2">
                <Row
                  label="Commission"
                  value={formatMoney(commission, order.currency)}
                  hint="Internal"
                />
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-wx-muted">
        {label}
        {hint && <span className="ml-1 text-[10px] uppercase">({hint})</span>}
      </dt>
      <dd className="break-all text-right font-medium">{value}</dd>
    </div>
  );
}
