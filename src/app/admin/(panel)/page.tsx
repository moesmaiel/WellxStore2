import Link from "next/link";
import { getDashboard } from "@/lib/analytics";
import { getSettings } from "@/lib/repo";
import { num } from "@/lib/db";
import { PageHeader, Card, Chip } from "@/components/admin/ui";
import { formatMoney } from "@/lib/pricing";
import { FULFILLMENT_LABELS } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [d, settings] = await Promise.all([getDashboard(), getSettings()]);
  const currency = d.totals.currency ?? settings.default_currency;

  const revenue = num(d.totals.revenue);
  const commission = num(d.commissionRow?.commission);
  const commissionPct = revenue > 0 ? Math.round((commission / revenue) * 100) : 0;
  const maxTypeRevenue = Math.max(1, ...d.byType.map((t) => num(t.revenue)));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Paid orders only. Pending carts are excluded." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue" value={formatMoney(revenue, currency)} accent />
        <Stat
          label="Commission earned"
          value={formatMoney(commission, currency)}
          sub={`${commissionPct}% of revenue`}
        />
        <Stat label="Paid orders" value={String(num(d.totals.orders))} />
        <Stat
          label="Affiliate redemptions"
          value={String(num(d.affiliate?.copied) + num(d.affiliate?.redirected))}
          sub={`${num(d.affiliate?.copied)} copied · ${num(d.affiliate?.redirected)} redirected`}
        />
      </div>

      {/* Needs attention */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ActionCard
          label="Codes to send"
          count={num(d.pending?.code_pending)}
          href="/admin/orders"
        />
        <ActionCard
          label="Awaiting dispatch"
          count={num(d.pending?.processing)}
          href="/admin/orders"
        />
        <ActionCard
          label="With vendors"
          count={num(d.pending?.with_vendor)}
          href="/admin/orders"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Orders by fulfillment type */}
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Revenue by fulfillment type</h2>
          {d.byType.length === 0 ? (
            <p className="text-sm text-wx-muted">No paid orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {d.byType.map((t) => (
                <li key={t.fulfillment_type}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">
                      {FULFILLMENT_LABELS[t.fulfillment_type]}
                    </span>
                    <span className="text-wx-muted">
                      {num(t.orders)} {num(t.orders) === 1 ? "order" : "orders"} ·{" "}
                      <span className="font-semibold text-wx-ink">
                        {formatMoney(num(t.revenue), currency)}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-wx-bg">
                    <div
                      className="h-full rounded-full wx-gradient"
                      style={{ width: `${(num(t.revenue) / maxTypeRevenue) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Top products */}
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Top products</h2>
          {d.topProducts.length === 0 ? (
            <p className="text-sm text-wx-muted">No sales yet.</p>
          ) : (
            <ul className="divide-y divide-wx-line text-sm">
              {d.topProducts.map((p) => (
                <li key={p.name} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                  <span className="text-xs text-wx-muted">{num(p.units)} sold</span>
                  <span className="w-24 text-right font-semibold">
                    {formatMoney(num(p.revenue), currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Top brands */}
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Top brands</h2>
          {d.topBrands.length === 0 ? (
            <p className="text-sm text-wx-muted">No sales yet.</p>
          ) : (
            <ul className="divide-y divide-wx-line text-sm">
              {d.topBrands.map((b) => (
                <li key={b.name} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0 flex-1 truncate font-medium">{b.name}</span>
                  <span className="text-xs text-wx-muted">{num(b.units)} sold</span>
                  <span className="w-24 text-right font-semibold">
                    {formatMoney(num(b.revenue), currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Commission vs revenue */}
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Commission vs revenue</h2>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-wx-muted">Revenue</p>
              <p className="text-2xl font-extrabold">{formatMoney(revenue, currency)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-wx-muted">Commission</p>
              <p className="text-2xl font-extrabold wx-gradient-text">
                {formatMoney(commission, currency)}
              </p>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-wx-bg">
            <div className="h-full rounded-full wx-gradient" style={{ width: `${commissionPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-wx-muted">
            Commission is {commissionPct}% of revenue. Internal figure — never shown to customers.
          </p>
        </Card>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-wx-muted">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${accent ? "wx-gradient-text" : ""}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-wx-muted">{sub}</p>}
    </Card>
  );
}

function ActionCard({ label, count, href }: { label: string; count: number; href: string }) {
  return (
    <Link
      href={href}
      className="wx-focus rounded-2xl border border-wx-line bg-white p-4 transition hover:border-wx-purple"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Chip tone={count > 0 ? "amber" : "neutral"}>{count}</Chip>
      </div>
    </Link>
  );
}
