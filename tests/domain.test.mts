import { discountPercent, cartTotals, formatMoney } from "../src/lib/pricing";
import { isCartable, statusFlow, nextStatuses, statusAfterPayment, isTerminal } from "../src/lib/fulfillment";
import { deriveOrderStatus } from "../src/lib/order-status";
import type { FulfillmentType, ItemStatus } from "../src/lib/types";

let fails = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { fails++; console.log(`FAIL ${label}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
  else console.log(`ok   ${label}`);
};

eq("discount 100->90", discountPercent(100, 90), 10);
eq("discount 1200->960", discountPercent(1200, 960), 20);
eq("discount equal prices", discountPercent(100, 100), 0);
eq("discount zero regular", discountPercent(0, 0), 0);
eq("money AED whole", formatMoney(960, "AED"), "AED 960");

eq("affiliate not cartable", isCartable("affiliate"), false);
eq("access_code cartable", isCartable("access_code"), true);

eq("own flow", statusFlow("own_inventory"), ["pending_payment","paid","processing","shipped","delivered"]);
eq("code flow", statusFlow("access_code"), ["pending_payment","paid","code_pending","code_sent"]);
eq("drop flow", statusFlow("drop_shipping"), ["pending_payment","paid","forwarded_to_vendor","vendor_confirmed","shipped","delivered"]);
eq("affiliate flow empty", statusFlow("affiliate"), []);

eq("after payment own", statusAfterPayment("own_inventory"), "processing");
eq("after payment code", statusAfterPayment("access_code"), "code_pending");
eq("after payment drop", statusAfterPayment("drop_shipping"), "forwarded_to_vendor");

eq("next from processing", nextStatuses("own_inventory","processing"), ["shipped","cancelled","refunded"]);
eq("next from delivered", nextStatuses("own_inventory","delivered"), ["cancelled","refunded"]);
eq("next from cancelled", nextStatuses("own_inventory","cancelled"), []);
eq("next from code_pending", nextStatuses("access_code","code_pending"), ["code_sent","cancelled","refunded"]);

eq("delivered terminal", isTerminal("own_inventory","delivered"), true);
eq("code_sent terminal", isTerminal("access_code","code_sent"), true);
eq("processing not terminal", isTerminal("own_inventory","processing"), false);

const it = (t: FulfillmentType, s: ItemStatus) => ({ fulfillment_type: t, status: s });
eq("order empty", deriveOrderStatus([]), "pending_payment");
eq("order all pending", deriveOrderStatus([it("own_inventory","pending_payment")]), "pending_payment");
eq("order all paid-mid", deriveOrderStatus([it("own_inventory","processing"), it("access_code","code_pending")]), "paid");
eq("order mixed partial", deriveOrderStatus([it("own_inventory","delivered"), it("access_code","code_pending")]), "partially_fulfilled");
eq("order all done", deriveOrderStatus([it("own_inventory","delivered"), it("access_code","code_sent")]), "fulfilled");
eq("order all cancelled", deriveOrderStatus([it("own_inventory","cancelled"), it("access_code","cancelled")]), "cancelled");
eq("order all refunded", deriveOrderStatus([it("own_inventory","refunded")]), "refunded");
eq("order cancelled one, other done", deriveOrderStatus([it("own_inventory","cancelled"), it("access_code","code_sent")]), "fulfilled");
eq("order cancelled one, other mid", deriveOrderStatus([it("own_inventory","cancelled"), it("access_code","code_pending")]), "paid");

const t = cartTotals([
  { unit_regular_price: 1200, unit_wellx_price: 960, unit_commission: 120, quantity: 1 },
  { unit_regular_price: 1000, unit_wellx_price: 700, unit_commission: 210, quantity: 2 },
]);
eq("cart subtotal", t.subtotal, 2360);
eq("cart saved", t.saved, 840);
eq("cart commission", t.commission, 540);
eq("cart count", t.itemCount, 3);

console.log(fails ? `\n${fails} FAILURES` : "\nall domain checks passed");
process.exit(fails ? 1 : 0);
