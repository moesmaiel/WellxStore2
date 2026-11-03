import type { OrderStatus } from "./types";

/**
 * Checkout is guest-only, so there is no customer row to key off — a
 * "customer" only exists as the set of orders that share an email or phone
 * number. This module derives that grouping from orders.
 */

export type OrderForDedup = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  status: OrderStatus;
  created_at: string;
};

export type Customer = {
  /** The earliest order's id — stable as long as that order isn't deleted. */
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orderIds: string[];
  orderCount: number;
  /** Sum of order totals, excluding cancelled/refunded orders. */
  totalSpent: number;
  lastOrderAt: string;
};

function normEmail(email: string | null | undefined): string | null {
  const v = (email ?? "").trim().toLowerCase();
  return v || null;
}

function normPhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  // Require a handful of digits before treating it as a matchable phone —
  // avoids merging two customers who both left the field blank.
  return digits.length >= 6 ? digits : null;
}

/**
 * Groups orders into customers: two orders are the same customer if they
 * share a normalized email OR a normalized phone number, and that match is
 * transitive — order A matching B by phone and B matching C by email puts
 * all three in one group. Pure function, no I/O, so it's unit-testable
 * without a database.
 */
export function groupOrdersIntoCustomers(orders: OrderForDedup[]): Customer[] {
  const parent = orders.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  const byEmail = new Map<string, number>();
  const byPhone = new Map<string, number>();
  orders.forEach((o, i) => {
    const e = normEmail(o.customer_email);
    const p = normPhone(o.customer_phone);
    if (e) {
      const prev = byEmail.get(e);
      if (prev !== undefined) union(i, prev);
      else byEmail.set(e, i);
    }
    if (p) {
      const prev = byPhone.get(p);
      if (prev !== undefined) union(i, prev);
      else byPhone.set(p, i);
    }
  });

  const groups = new Map<number, number[]>();
  orders.forEach((_, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  });

  const customers: Customer[] = [];
  for (const idxs of groups.values()) {
    const rows = idxs
      .map((i) => orders[i])
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    const latest = rows[0];
    const earliest = rows[rows.length - 1];
    const totalSpent = rows
      .filter((r) => r.status !== "cancelled" && r.status !== "refunded")
      .reduce((sum, r) => sum + r.total, 0);

    customers.push({
      id: earliest.id,
      name: latest.customer_name,
      email: latest.customer_email,
      phone: latest.customer_phone,
      orderIds: rows.map((r) => r.id),
      orderCount: rows.length,
      totalSpent,
      lastOrderAt: latest.created_at,
    });
  }

  return customers.sort((a, b) => +new Date(b.lastOrderAt) - +new Date(a.lastOrderAt));
}
