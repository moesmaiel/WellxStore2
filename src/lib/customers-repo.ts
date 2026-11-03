import "server-only";
import { query, num } from "./db";
import { getOrder } from "./repo";
import { groupOrdersIntoCustomers, type Customer, type OrderForDedup } from "./customers";
import type { OrderWithItems } from "./types";

export async function listCustomers(): Promise<Customer[]> {
  const rows = await query<OrderForDedup>(
    `select id, customer_name, customer_email, customer_phone, total, status, created_at
     from orders
     order by created_at asc`
  );
  return groupOrdersIntoCustomers(rows.map((r) => ({ ...r, total: num(r.total) })));
}

export async function getCustomerDetail(
  anyOrderId: string
): Promise<{ customer: Customer; orders: OrderWithItems[] } | null> {
  const customers = await listCustomers();
  const customer = customers.find((c) => c.orderIds.includes(anyOrderId));
  if (!customer) return null;

  const orders = (await Promise.all(customer.orderIds.map((id) => getOrder(id)))).filter(
    (o): o is OrderWithItems => o !== null
  );
  orders.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

  return { customer, orders };
}
