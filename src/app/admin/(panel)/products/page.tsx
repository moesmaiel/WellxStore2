import Link from "next/link";
import { Plus } from "lucide-react";
import { listProducts, getSettings } from "@/lib/repo";
import { PageHeader, Card, Chip, EmptyState } from "@/components/admin/ui";
import { discountPercent, formatMoney } from "@/lib/pricing";
import { FULFILLMENT_LABELS } from "@/lib/fulfillment";
import { ProductRowActions } from "./ProductRowActions";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, settings] = await Promise.all([listProducts(), getSettings()]);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products. Commission is internal and never shown to customers.`}
        action={
          <Link
            href="/admin/products/new"
            className="wx-focus inline-flex items-center gap-1.5 rounded-full wx-gradient px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Plus size={14} aria-hidden="true" /> New product
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState>No products yet.</EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-wx-line text-left text-xs uppercase tracking-wider text-wx-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Fulfillment</th>
                <th className="px-4 py-3 text-right font-semibold">Regular</th>
                <th className="px-4 py-3 text-right font-semibold">Wellx</th>
                <th className="px-4 py-3 text-right font-semibold">Off</th>
                <th className="px-4 py-3 text-right font-semibold">Commission</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-wx-line">
              {products.map((p) => {
                const currency = p.currency ?? settings.default_currency;
                return (
                  <tr key={p.id} className="hover:bg-wx-bg/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="wx-focus rounded font-semibold hover:text-wx-purple"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-wx-muted">
                        {p.brand?.name ?? "No brand"}
                        {p.category ? ` · ${p.category.name}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Chip tone="purple">{FULFILLMENT_LABELS[p.fulfillment_type]}</Chip>
                    </td>
                    <td className="px-4 py-3 text-right text-wx-muted line-through">
                      {formatMoney(p.regular_price, currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatMoney(p.wellx_price, currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {discountPercent(p.regular_price, p.wellx_price)}%
                    </td>
                    <td className="px-4 py-3 text-right text-wx-muted">
                      {formatMoney(p.commission, currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Chip tone={p.is_active ? "green" : "neutral"}>
                        {p.is_active ? "Active" : "Hidden"}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ProductRowActions id={p.id} name={p.name} slug={p.slug} />
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
