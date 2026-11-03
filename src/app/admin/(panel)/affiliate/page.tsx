import Link from "next/link";
import { query } from "@/lib/db";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

type AffiliateRow = {
  product_id: string;
  name: string;
  slug: string;
  affiliate_code: string | null;
  viewed: string;
  copied: string;
  redirected: string;
  last_at: string | null;
};

/**
 * Affiliate products are never orders. This is the redemption log: how often a
 * code was seen, copied, and followed through to the partner.
 */
export default async function AffiliatePage() {
  const rows = await query<AffiliateRow>(`
    select p.id as product_id, p.name, p.slug, p.affiliate_code,
           count(*) filter (where e.event_type = 'code_viewed')  as viewed,
           count(*) filter (where e.event_type = 'code_copied')  as copied,
           count(*) filter (where e.event_type = 'redirected')   as redirected,
           max(e.created_at) as last_at
    from products p
    left join affiliate_events e on e.product_id = p.id
    where p.fulfillment_type = 'affiliate'
    group by p.id, p.name, p.slug, p.affiliate_code
    order by count(e.id) desc, p.name
  `);

  const total = rows.reduce((n, r) => n + Number(r.copied) + Number(r.redirected), 0);

  return (
    <>
      <PageHeader
        title="Affiliate log"
        subtitle={`${total} redemption events. Affiliate products are tracked here instead of in the order pipeline.`}
      />

      {rows.length === 0 ? (
        <EmptyState>No affiliate products yet.</EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-sm">
            <thead className="border-b border-wx-line text-left text-xs uppercase tracking-wider text-wx-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 text-right font-semibold">Viewed</th>
                <th className="px-4 py-3 text-right font-semibold">Copied</th>
                <th className="px-4 py-3 text-right font-semibold">Redirected</th>
                <th className="px-4 py-3 font-semibold">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wx-line">
              {rows.map((r) => (
                <tr key={r.product_id} className="hover:bg-wx-bg/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/product/${r.slug}`}
                      target="_blank"
                      className="wx-focus rounded font-semibold hover:text-wx-purple"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-wx-bg px-2 py-0.5 text-xs font-bold tracking-wider">
                      {r.affiliate_code}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-right">{r.viewed}</td>
                  <td className="px-4 py-3 text-right font-semibold">{r.copied}</td>
                  <td className="px-4 py-3 text-right font-semibold">{r.redirected}</td>
                  <td className="px-4 py-3 text-wx-muted">
                    {r.last_at ? new Date(r.last_at).toLocaleString("en-GB") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
