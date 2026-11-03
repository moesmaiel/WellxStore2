import { NextResponse } from "next/server";
import { getProductsByIds, getSettings } from "@/lib/repo";
import { isCartable } from "@/lib/fulfillment";

export type ResolvedLine = {
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  brandName: string | null;
  image: string | null;
  regular_price: number;
  wellx_price: number;
  currency: string;
  fulfillment_type: string;
  /** Set when the line can no longer be purchased, with the reason why. */
  unavailable: string | null;
};

/**
 * Resolves a cart (ids + quantities) against live product rows. Prices,
 * availability and fulfillment type always come from the server, so a stale
 * localStorage cart can never lock in an old price.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const lines: unknown = body?.lines;
  if (!Array.isArray(lines)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const wanted = lines
    .filter(
      (l): l is { productId: string; quantity: number } =>
        typeof l?.productId === "string" && Number.isFinite(l?.quantity)
    )
    .map((l) => ({ ...l, quantity: Math.max(1, Math.min(99, Math.floor(l.quantity))) }));

  const [products, settings] = await Promise.all([
    getProductsByIds(wanted.map((l) => l.productId)),
    getSettings(),
  ]);

  const resolved: ResolvedLine[] = wanted.flatMap((line) => {
    const p = products.find((x) => x.id === line.productId);
    if (!p) return [];

    let unavailable: string | null = null;
    if (!p.is_active) unavailable = "No longer available";
    else if (!isCartable(p.fulfillment_type))
      unavailable = "Redeemed on the partner's site";
    else if (
      p.fulfillment_type === "own_inventory" &&
      p.stock_qty !== null &&
      p.stock_qty < line.quantity
    )
      unavailable = p.stock_qty <= 0 ? "Out of stock" : `Only ${p.stock_qty} left`;

    return [
      {
        productId: p.id,
        quantity: line.quantity,
        name: p.name,
        slug: p.slug,
        brandName: p.brand?.name ?? null,
        image: p.images[0] ?? null,
        regular_price: p.regular_price,
        wellx_price: p.wellx_price,
        currency: p.currency ?? settings.default_currency,
        fulfillment_type: p.fulfillment_type,
        unavailable,
      },
    ];
  });

  return NextResponse.json({ lines: resolved, currency: settings.default_currency });
}
