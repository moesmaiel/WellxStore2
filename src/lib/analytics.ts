import "server-only";
import { query } from "./db";
import type { FulfillmentType } from "./types";

/**
 * Dashboard aggregations. Only orders that have actually been paid count
 * toward revenue, so pending-payment carts never inflate the numbers.
 */
const PAID = `status not in ('pending_payment','cancelled','refunded')`;

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

export async function getDashboard() {
  const [totals] = await query<{
    revenue: string;
    orders: string;
    currency: string | null;
  }>(`select coalesce(sum(total),0) as revenue,
             count(*) as orders,
             min(currency) as currency
      from orders where ${PAID}`);

  const [commissionRow] = await query<{ commission: string }>(
    `select coalesce(sum(oi.unit_commission * oi.quantity),0) as commission
     from order_items oi
     join orders o on o.id = oi.order_id
     where o.${PAID} and oi.status not in ('cancelled','refunded')`
  );

  const byType = await query<{
    fulfillment_type: FulfillmentType;
    orders: string;
    units: string;
    revenue: string;
  }>(`select oi.fulfillment_type,
             count(distinct oi.order_id) as orders,
             coalesce(sum(oi.quantity),0) as units,
             coalesce(sum(oi.unit_wellx_price * oi.quantity),0) as revenue
      from order_items oi
      join orders o on o.id = oi.order_id
      where o.${PAID}
      group by oi.fulfillment_type
      order by revenue desc`);

  const topProducts = await query<{
    name: string;
    units: string;
    revenue: string;
    commission: string;
  }>(`select oi.product_snapshot->>'name' as name,
             sum(oi.quantity) as units,
             sum(oi.unit_wellx_price * oi.quantity) as revenue,
             sum(oi.unit_commission * oi.quantity) as commission
      from order_items oi
      join orders o on o.id = oi.order_id
      where o.${PAID}
      group by 1
      order by revenue desc
      limit 5`);

  const topBrands = await query<{ name: string; units: string; revenue: string }>(
    `select coalesce(oi.product_snapshot->>'brand_name','No brand') as name,
            sum(oi.quantity) as units,
            sum(oi.unit_wellx_price * oi.quantity) as revenue
     from order_items oi
     join orders o on o.id = oi.order_id
     where o.${PAID}
     group by 1
     order by revenue desc
     limit 5`
  );

  const [affiliate] = await query<{ copied: string; redirected: string }>(
    `select count(*) filter (where event_type='code_copied') as copied,
            count(*) filter (where event_type='redirected') as redirected
     from affiliate_events`
  );

  const [pending] = await query<{
    code_pending: string;
    processing: string;
    with_vendor: string;
  }>(`select count(*) filter (where status='code_pending')        as code_pending,
             count(*) filter (where status='processing')          as processing,
             count(*) filter (where status='forwarded_to_vendor') as with_vendor
      from order_items`);

  return { totals, commissionRow, byType, topProducts, topBrands, affiliate, pending };
}
