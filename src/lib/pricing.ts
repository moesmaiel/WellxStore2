/**
 * Pricing rules. Discount is always derived from the two prices, never stored,
 * so it can't fall out of sync with an edit.
 */

export function discountPercent(regular: number, wellx: number): number {
  if (!regular || regular <= 0 || wellx >= regular) return 0;
  return Math.round(((regular - wellx) / regular) * 100);
}

export function savings(regular: number, wellx: number): number {
  return Math.max(0, regular - wellx);
}

export function formatMoney(amount: number, currency = "AED"): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      minimumFractionDigits: safe % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })
      .format(safe)
      // Intl inserts a non-breaking space after the currency code; use a plain
      // one so rendered output is predictable.
      .replace(/\u00a0/g, " ");
  } catch {
    // Unknown currency code — fall back to a plain prefixed number.
    return `${currency} ${safe.toFixed(safe % 1 === 0 ? 0 : 2)}`;
  }
}

export type PricedLine = {
  unit_regular_price: number;
  unit_wellx_price: number;
  unit_commission?: number;
  quantity: number;
};

export function cartTotals(lines: PricedLine[]) {
  const regularTotal = lines.reduce(
    (sum, l) => sum + l.unit_regular_price * l.quantity,
    0
  );
  const subtotal = lines.reduce(
    (sum, l) => sum + l.unit_wellx_price * l.quantity,
    0
  );
  const commission = lines.reduce(
    (sum, l) => sum + (l.unit_commission ?? 0) * l.quantity,
    0
  );
  return {
    regularTotal,
    subtotal,
    total: subtotal,
    saved: Math.max(0, regularTotal - subtotal),
    commission,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
  };
}
