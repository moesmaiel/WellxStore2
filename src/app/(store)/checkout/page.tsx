"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useResolvedCart } from "@/lib/useResolvedCart";
import { cartTotals, formatMoney } from "@/lib/pricing";
import { FULFILLMENT_LABELS } from "@/lib/fulfillment";
import type { FulfillmentType } from "@/lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const { resolved, loading, ready } = useResolvedCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchasable = resolved.filter((l) => !l.unavailable);
  const currency = purchasable[0]?.currency ?? "AED";
  const totals = cartTotals(
    purchasable.map((l) => ({
      unit_regular_price: l.regular_price,
      unit_wellx_price: l.wellx_price,
      quantity: l.quantity,
    }))
  );

  // Distinct fulfillment types present, so the customer knows before paying
  // that items may arrive separately.
  const types = [...new Set(purchasable.map((l) => l.fulfillment_type as FulfillmentType))];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      customer_name: String(fd.get("name") ?? ""),
      customer_email: String(fd.get("email") ?? ""),
      customer_phone: String(fd.get("phone") ?? ""),
      shipping_address: {
        line1: String(fd.get("line1") ?? ""),
        line2: String(fd.get("line2") ?? ""),
        city: String(fd.get("city") ?? ""),
        state: String(fd.get("state") ?? ""),
        postal_code: String(fd.get("postal_code") ?? ""),
        country: String(fd.get("country") ?? ""),
      },
      lines: purchasable.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      clear();
      router.push(data.redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setSubmitting(false);
    }
  }

  if (!ready || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-wx-muted sm:px-6">
        Loading checkout…
      </div>
    );
  }

  if (lines.length === 0 || purchasable.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Nothing to check out</h1>
        <Link
          href="/shop"
          className="wx-focus mt-6 inline-block rounded-full wx-gradient px-7 py-3.5 font-semibold text-white"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Checkout</h1>
      <p className="mb-8 text-neutral-600">
        Guest checkout — no account required.
      </p>

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <fieldset className="rounded-2xl border border-wx-line bg-white p-5">
            <legend className="px-2 text-sm font-bold uppercase tracking-wider text-wx-muted">
              Contact
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="name" label="Full name" required autoComplete="name" />
              <Field name="email" label="Email" type="email" required autoComplete="email" />
              <Field name="phone" label="Phone" type="tel" autoComplete="tel" />
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-wx-line bg-white p-5">
            <legend className="px-2 text-sm font-bold uppercase tracking-wider text-wx-muted">
              Shipping address
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="line1" label="Address" required autoComplete="address-line1" wide />
              <Field name="line2" label="Apartment, suite (optional)" autoComplete="address-line2" wide />
              <Field name="city" label="City" required autoComplete="address-level2" />
              <Field name="state" label="Emirate / State" autoComplete="address-level1" />
              <Field name="postal_code" label="Postal code" autoComplete="postal-code" />
              <Field name="country" label="Country" required defaultValue="United Arab Emirates" autoComplete="country-name" />
            </div>
          </fieldset>

          <div className="rounded-2xl border border-wx-line bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-wx-muted">Payment</h2>
            <p className="mt-3 text-sm text-neutral-700">
              Card payment is handled by Stripe. This build runs the mock provider,
              so placing the order completes payment immediately for testing.
            </p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-wx-line bg-white p-5">
            <h2 className="text-lg font-bold">Your order</h2>

            <ul className="mt-4 space-y-3 text-sm">
              {purchasable.map((l) => (
                <li key={l.productId} className="flex justify-between gap-3">
                  <span>
                    {l.name}
                    <span className="text-wx-muted"> × {l.quantity}</span>
                  </span>
                  <span className="whitespace-nowrap font-semibold">
                    {formatMoney(l.wellx_price * l.quantity, l.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-wx-line pt-4 text-sm">
              <div className="flex justify-between font-semibold text-emerald-600">
                <dt>Member savings</dt>
                <dd>−{formatMoney(totals.saved, currency)}</dd>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatMoney(totals.total, currency)}</dd>
              </div>
            </dl>

            {types.length > 1 && (
              <div className="mt-4 rounded-xl bg-wx-bg p-3 text-xs text-neutral-700">
                <p className="font-semibold">Your items are fulfilled differently:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {types.map((t) => (
                    <li key={t}>{FULFILLMENT_LABELS[t]} — arrives separately</li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="wx-focus mt-5 w-full rounded-full wx-gradient px-6 py-3.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Placing order…" : `Pay ${formatMoney(totals.total, currency)}`}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  wide,
  defaultValue,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  wide?: boolean;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <label className={`block text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block font-medium text-neutral-700">
        {label}
        {required && <span className="text-wx-pink"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className="wx-focus w-full rounded-xl border border-wx-line bg-white px-3 py-2.5 outline-none"
      />
    </label>
  );
}
