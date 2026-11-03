import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCustomerDetail } from "@/lib/customers-repo";
import { getSettings } from "@/lib/repo";
import { PageHeader, Card, Chip } from "@/components/admin/ui";
import { formatMoney } from "@/lib/pricing";
import { FULFILLMENT_LABELS, ORDER_STATUS_LABELS } from "@/lib/fulfillment";
import { orderTone } from "../../orders/page";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage(
  props: PageProps<"/admin/customers/[id]">
) {
  const { id } = await props.params;
  const [detail, settings] = await Promise.all([getCustomerDetail(id), getSettings()]);
  if (!detail) notFound();

  const { customer, orders } = detail;
  const currency = orders[0]?.currency ?? settings.default_currency;

  return (
    <>
      <Link
        href="/admin/customers"
        className="wx-focus mb-4 inline-flex items-center gap-1.5 rounded text-sm text-wx-muted hover:text-wx-ink"
      >
        <ArrowLeft size={14} aria-hidden="true" /> All customers
      </Link>

      <PageHeader
        title={customer.name}
        subtitle={`${customer.orderCount} order${customer.orderCount === 1 ? "" : "s"} · ${formatMoney(customer.totalSpent, currency)} total spent`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-wx-muted">
            Order history
          </h2>
          {orders.map((order) => {
            const types = [...new Set(order.items.map((i) => i.fulfillment_type))];
            return (
              <Card key={order.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="wx-focus rounded font-bold hover:text-wx-purple"
                    >
                      {order.order_number}
                    </Link>
                    <p className="text-xs text-wx-muted">
                      {new Date(order.created_at).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatMoney(order.total, order.currency)}</p>
                    <Chip tone={orderTone(order.status)}>{ORDER_STATUS_LABELS[order.status]}</Chip>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {types.map((t) => (
                    <Chip key={t} tone="purple">
                      {FULFILLMENT_LABELS[t]}
                    </Chip>
                  ))}
                </div>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="wx-focus mt-3 inline-block rounded text-sm font-semibold text-wx-purple hover:underline"
                >
                  View order details →
                </Link>
              </Card>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <Card className="p-5">
            <h2 className="mb-3 font-bold">Contact</h2>
            <dl className="space-y-2 text-sm">
              <Row label="Name" value={customer.name} />
              <Row label="Email" value={customer.email} />
              <Row label="Phone" value={customer.phone ?? "—"} />
            </dl>
            <p className="mt-4 text-xs text-wx-muted">
              Identity is derived from orders that share this email or phone number — there
              is no separate account, since checkout is guest-only.
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-wx-muted">{label}</dt>
      <dd className="break-all text-right font-medium">{value}</dd>
    </div>
  );
}
