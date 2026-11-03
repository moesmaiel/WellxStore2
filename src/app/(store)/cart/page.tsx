"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useResolvedCart } from "@/lib/useResolvedCart";
import { cartTotals, formatMoney } from "@/lib/pricing";
import { ProductImage } from "@/components/store/ProductImage";
import { FULFILLMENT_LABELS } from "@/lib/fulfillment";
import type { FulfillmentType } from "@/lib/types";

export default function CartPage() {
  const { setQuantity, remove } = useCart();
  const { resolved, loading, ready } = useResolvedCart();

  const purchasable = resolved.filter((l) => !l.unavailable);
  const currency = purchasable[0]?.currency ?? resolved[0]?.currency ?? "AED";
  const totals = cartTotals(
    purchasable.map((l) => ({
      unit_regular_price: l.regular_price,
      unit_wellx_price: l.wellx_price,
      quantity: l.quantity,
    }))
  );

  if (!ready || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-wx-muted sm:px-6">
        Loading your cart…
      </div>
    );
  }

  if (resolved.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-neutral-600">Member pricing is waiting.</p>
        <Link
          href="/shop"
          className="wx-focus mt-6 inline-block rounded-full wx-gradient px-7 py-3.5 font-semibold text-white transition hover:opacity-90"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight">Your cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="space-y-4">
          {resolved.map((line) => (
            <li
              key={line.productId}
              className="flex flex-col gap-4 rounded-2xl border border-wx-line bg-white p-4 sm:flex-row"
            >
              <Link href={`/product/${line.slug}`} className="wx-focus shrink-0 rounded-xl">
                <ProductImage
                  src={line.image}
                  alt={line.name}
                  initials={line.brandName ?? line.name}
                  className="h-24 w-24 rounded-xl"
                />
              </Link>

              <div className="min-w-0 flex-1">
                {line.brandName && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-wx-muted">
                    {line.brandName}
                  </p>
                )}
                <Link
                  href={`/product/${line.slug}`}
                  className="wx-focus rounded font-bold hover:text-wx-purple"
                >
                  {line.name}
                </Link>
                <p className="mt-1 text-xs text-wx-muted">
                  {FULFILLMENT_LABELS[line.fulfillment_type as FulfillmentType]}
                </p>

                {line.unavailable ? (
                  <p className="mt-2 text-sm font-semibold text-red-600">{line.unavailable}</p>
                ) : (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-wx-line">
                      <button
                        aria-label={`Decrease quantity of ${line.name}`}
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                        className="wx-focus rounded-l-full p-2 hover:bg-wx-bg"
                      >
                        <Minus size={14} aria-hidden="true" />
                      </button>
                      <span className="w-9 text-center text-sm font-semibold">
                        {line.quantity}
                      </span>
                      <button
                        aria-label={`Increase quantity of ${line.name}`}
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        className="wx-focus rounded-r-full p-2 hover:bg-wx-bg"
                      >
                        <Plus size={14} aria-hidden="true" />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(line.productId)}
                      aria-label={`Remove ${line.name}`}
                      className="wx-focus rounded-full p-2 text-wx-muted transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>

              <div className="text-right sm:w-32">
                <p className="font-bold">
                  {formatMoney(line.wellx_price * line.quantity, line.currency)}
                </p>
                {line.regular_price > line.wellx_price && (
                  <p className="text-sm text-wx-muted line-through">
                    {formatMoney(line.regular_price * line.quantity, line.currency)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-wx-line bg-white p-5">
            <h2 className="text-lg font-bold">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-600">Regular price</dt>
                <dd className="text-wx-muted line-through">
                  {formatMoney(totals.regularTotal, currency)}
                </dd>
              </div>
              <div className="flex justify-between font-semibold text-emerald-600">
                <dt>Member savings</dt>
                <dd>−{formatMoney(totals.saved, currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-wx-line pt-3 text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatMoney(totals.total, currency)}</dd>
              </div>
            </dl>

            {purchasable.length > 0 ? (
              <Link
                href="/checkout"
                className="wx-focus mt-5 block rounded-full wx-gradient px-6 py-3.5 text-center font-semibold text-white transition hover:opacity-90"
              >
                Checkout
              </Link>
            ) : (
              <p className="mt-5 text-sm text-red-600">
                Nothing in your cart can be checked out right now.
              </p>
            )}

            <p className="mt-3 text-center text-xs text-wx-muted">
              Guest checkout — no account needed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
