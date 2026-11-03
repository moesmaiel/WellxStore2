"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, EmptyState } from "@/components/admin/ui";
import { formatMoney } from "@/lib/pricing";
import type { Customer } from "@/lib/customers";

export function CustomerTable({
  customers,
  currency,
}: {
  customers: Customer[];
  currency: string;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        (c.phone ?? "").toLowerCase().includes(needle)
    );
  }, [customers, q]);

  return (
    <div>
      <div className="relative mb-4 max-w-sm">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-wx-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email or phone"
          aria-label="Search customers"
          className="wx-focus w-full rounded-xl border border-wx-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState>
          {customers.length === 0 ? "No customers yet." : "No customers match that search."}
        </EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-wx-line text-left text-xs uppercase tracking-wider text-wx-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 text-right font-semibold">Orders</th>
                <th className="px-4 py-3 text-right font-semibold">Total spent</th>
                <th className="px-4 py-3 font-semibold">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wx-line">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-wx-bg/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="wx-focus rounded font-semibold hover:text-wx-purple"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{c.email}</td>
                  <td className="px-4 py-3 text-neutral-700">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{c.orderCount}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatMoney(c.totalSpent, currency)}
                  </td>
                  <td className="px-4 py-3 text-wx-muted">
                    {new Date(c.lastOrderAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
