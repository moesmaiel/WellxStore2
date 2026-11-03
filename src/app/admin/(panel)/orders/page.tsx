import Link from "next/link";
import { listOrders } from "@/lib/repo";
import { PageHeader, Card, Chip, EmptyState } from "@/components/admin/ui";
import { formatMoney } from "@/lib/pricing";
import { FULFILLMENT_LABELS, ORDER_STATUS_LABELS } from "@/lib/fulfillment";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export function orderTone(status: OrderStatus) {
  if (status === "fulfilled") return "green" as const;
  if (status === "partially_fulfilled") return "purple" as const;
  if (status === "pending_payment") return "amber" as const;
  if (status === "cancelled" || status === "refunded") return "red" as const;
  return "neutral" as const;
}

export default async function OrdersPage() {
  const orders = await listOrders();

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="One order can mix fulfillment types. Each line item moves through its own pipeline."
      />

      {orders.length === 0 ? (
        <EmptyState>No orders yet.</EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-wx-line text-left text-xs uppercase tracking-wider text-wx-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wx-line">
              {orders.map((o) => {
                const types = [...new Set(o.items.map((i) => i.fulfillment_type))];
                return (
                  <tr key={o.id} className="hover:bg-wx-bg/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="wx-focus rounded font-bold hover:text-wx-purple"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {o.customer_name}
                      <p className="text-xs text-wx-muted">{o.customer_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {types.map((t) => (
                          <Chip key={t} tone="purple">
                            {FULFILLMENT_LABELS[t]}
                          </Chip>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatMoney(o.total, o.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Chip tone={orderTone(o.status)}>{ORDER_STATUS_LABELS[o.status]}</Chip>
                    </td>
                    <td className="px-4 py-3 text-wx-muted">
                      {new Date(o.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
