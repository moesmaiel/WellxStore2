import { groupOrdersIntoCustomers, type OrderForDedup } from "../src/lib/customers";

let fails = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) {
    fails++;
    console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`);
  } else {
    console.log(`ok   ${label}`);
  }
};

function order(overrides: Partial<OrderForDedup> & { id: string }): OrderForDedup {
  return {
    customer_name: "Customer",
    customer_email: "customer@example.com",
    customer_phone: null,
    total: 100,
    status: "paid",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// --- same email groups two orders -----------------------------------------
{
  const orders = [
    order({ id: "a", customer_email: "Jane@Example.com", created_at: "2026-01-01T00:00:00Z" }),
    order({ id: "b", customer_email: "jane@example.com", created_at: "2026-01-05T00:00:00Z" }),
  ];
  const customers = groupOrdersIntoCustomers(orders);
  eq("same email (case-insensitive) merges into one customer", customers.length, 1);
  eq("merged order count", customers[0].orderCount, 2);
  eq("merged order ids", customers[0].orderIds.sort(), ["a", "b"]);
}

// --- same phone, different email groups two orders -------------------------
{
  const orders = [
    order({ id: "a", customer_email: "x@example.com", customer_phone: "+971 50 123 4567" }),
    order({ id: "b", customer_email: "y@example.com", customer_phone: "971-50-123-4567" }),
  ];
  const customers = groupOrdersIntoCustomers(orders);
  eq("same phone (different punctuation) merges by phone", customers.length, 1);
}

// --- transitive chain: A-B by phone, B-C by email ---------------------------
{
  const orders = [
    order({ id: "a", customer_email: "x@example.com", customer_phone: "5551234567", created_at: "2026-01-01T00:00:00Z" }),
    order({ id: "b", customer_email: "y@example.com", customer_phone: "5551234567", created_at: "2026-01-02T00:00:00Z" }),
    order({ id: "c", customer_email: "y@example.com", customer_phone: "5559999999", created_at: "2026-01-03T00:00:00Z" }),
  ];
  const customers = groupOrdersIntoCustomers(orders);
  eq("transitive chain merges all three orders", customers.length, 1);
  eq("transitive chain order count", customers[0].orderCount, 3);
}

// --- unrelated orders stay separate ------------------------------------------
{
  const orders = [
    order({ id: "a", customer_email: "x@example.com", customer_phone: "1111111111" }),
    order({ id: "b", customer_email: "y@example.com", customer_phone: "2222222222" }),
  ];
  const customers = groupOrdersIntoCustomers(orders);
  eq("unrelated orders stay separate customers", customers.length, 2);
}

// --- blank phones never cause a false merge ----------------------------------
{
  const orders = [
    order({ id: "a", customer_email: "x@example.com", customer_phone: "" }),
    order({ id: "b", customer_email: "y@example.com", customer_phone: null }),
    order({ id: "c", customer_email: "z@example.com", customer_phone: "   " }),
  ];
  const customers = groupOrdersIntoCustomers(orders);
  eq("blank/empty phones don't merge unrelated customers", customers.length, 3);
}

// --- totalSpent excludes cancelled/refunded, orderCount doesn't -------------
{
  const orders = [
    order({ id: "a", customer_email: "x@example.com", total: 100, status: "fulfilled" }),
    order({ id: "b", customer_email: "x@example.com", total: 50, status: "cancelled" }),
    order({ id: "c", customer_email: "x@example.com", total: 75, status: "refunded" }),
  ];
  const customers = groupOrdersIntoCustomers(orders);
  eq("orderCount includes cancelled/refunded orders", customers[0].orderCount, 3);
  eq("totalSpent excludes cancelled/refunded orders", customers[0].totalSpent, 100);
}

// --- name/email/phone reflect the most recent order --------------------------
{
  const orders = [
    order({
      id: "a",
      customer_name: "Jane Old",
      customer_email: "jane@old.com",
      customer_phone: "1111111111",
      created_at: "2026-01-01T00:00:00Z",
    }),
    order({
      id: "b",
      customer_name: "Jane New",
      customer_email: "jane@old.com",
      customer_phone: "2222222222",
      created_at: "2026-02-01T00:00:00Z",
    }),
  ];
  const customers = groupOrdersIntoCustomers(orders);
  eq("displayed name comes from the most recent order", customers[0].name, "Jane New");
  eq("displayed phone comes from the most recent order", customers[0].phone, "2222222222");
  eq("lastOrderAt is the most recent order's date", customers[0].lastOrderAt, "2026-02-01T00:00:00Z");
}

// --- id is stable: the earliest order's id -----------------------------------
{
  const orders = [
    order({ id: "first", customer_email: "x@example.com", created_at: "2026-01-01T00:00:00Z" }),
    order({ id: "second", customer_email: "x@example.com", created_at: "2026-01-10T00:00:00Z" }),
  ];
  const customers = groupOrdersIntoCustomers(orders);
  eq("customer id is the earliest order's id", customers[0].id, "first");
}

// --- customers list is sorted by most recent order first ---------------------
{
  const orders = [
    order({ id: "old", customer_email: "old@example.com", created_at: "2026-01-01T00:00:00Z" }),
    order({ id: "new", customer_email: "new@example.com", created_at: "2026-03-01T00:00:00Z" }),
  ];
  const customers = groupOrdersIntoCustomers(orders);
  eq("customers sorted by most recent order first", customers.map((c) => c.id), ["new", "old"]);
}

console.log(fails ? `\n${fails} FAILURES` : "\nall customer dedup checks passed");
process.exit(fails ? 1 : 0);
