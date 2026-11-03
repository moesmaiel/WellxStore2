"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Card, Field, inputClass, Button } from "./ui";
import { ImagePicker } from "./ImagePicker";
import { ProductCard } from "@/components/store/ProductCard";
import { discountPercent, formatMoney, savings } from "@/lib/pricing";
import { ctaFor, FULFILLMENT_LABELS } from "@/lib/fulfillment";
import { FULFILLMENT_TYPES, type Brand, type Category, type FulfillmentType, type ProductWithRefs } from "@/lib/types";
import { saveProduct } from "@/app/admin/(panel)/products/actions";

const BADGE_SUGGESTIONS = ["In stock", "New", "Best seller", "Limited", "Members only"];

export function ProductForm({
  product,
  categories,
  brands,
  defaultCurrency,
  currencies,
}: {
  product: ProductWithRefs | null;
  categories: Category[];
  brands: Brand[];
  defaultCurrency: string;
  currencies: string[];
}) {
  const [state, action, pending] = useActionState(saveProduct, {});

  // Mirrored in state so the live preview and conditional fields react as you type.
  const [name, setName] = useState(product?.name ?? "");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [regular, setRegular] = useState(String(product?.regular_price ?? ""));
  const [wellx, setWellx] = useState(String(product?.wellx_price ?? ""));
  const [currency, setCurrency] = useState(product?.currency ?? defaultCurrency);
  const [type, setType] = useState<FulfillmentType>(product?.fulfillment_type ?? "own_inventory");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [badges, setBadges] = useState<string[]>(product?.badges ?? []);
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [brandId, setBrandId] = useState(product?.brand_id ?? "");

  const topLevel = categories.filter((c) => !c.parent_id);
  const subcategories = categories.filter((c) => c.parent_id === categoryId);

  const regularNum = Number(regular) || 0;
  const wellxNum = Number(wellx) || 0;
  const off = discountPercent(regularNum, wellxNum);
  const priceWarning =
    regularNum > 0 && wellxNum > 0 && wellxNum >= regularNum
      ? "The Wellx price must be lower than the regular price."
      : null;

  const brandName = useMemo(
    () => brands.find((b) => b.id === brandId)?.name ?? null,
    [brandId, brands]
  );
  const cta = ctaFor(type);

  function toggleBadge(badge: string) {
    setBadges((prev) =>
      prev.includes(badge)
        ? prev.filter((b) => b !== badge)
        : prev.length >= 2
          ? prev
          : [...prev, badge]
    );
  }

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="badges" value={JSON.stringify(badges)} />

      <div className="space-y-6">
        {/* Basics */}
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Product details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" className="sm:col-span-2">
              <input
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Tagline" hint="One line shown on the product card." className="sm:col-span-2">
              <input
                name="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Brand">
              <select
                name="brand_id"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className={inputClass}
              >
                <option value="">— None —</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Category">
              <select
                name="category_id"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={inputClass}
              >
                <option value="">— None —</option>
                {topLevel.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Subcategory">
              <select
                name="subcategory_id"
                defaultValue={product?.subcategory_id ?? ""}
                disabled={subcategories.length === 0}
                className={inputClass}
              >
                <option value="">— None —</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Description" className="sm:col-span-2">
              <textarea
                name="description"
                rows={5}
                defaultValue={product?.description ?? ""}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Regular price" hint="Shown struck through.">
              <input
                name="regular_price"
                type="number"
                step="0.01"
                min="0"
                required
                value={regular}
                onChange={(e) => setRegular(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Wellx price" hint="What the member pays.">
              <input
                name="wellx_price"
                type="number"
                step="0.01"
                min="0"
                required
                value={wellx}
                onChange={(e) => setWellx(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Currency">
              <select
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputClass}
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                    {c === defaultCurrency ? " (store default)" : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Auto price label — computed, never stored */}
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-wx-bg p-3 text-sm">
            <span className="font-semibold">Customer sees:</span>
            <span className="text-wx-muted line-through">
              {formatMoney(regularNum, currency)}
            </span>
            <span className="font-bold wx-gradient-text">{formatMoney(wellxNum, currency)}</span>
            {off > 0 && (
              <span className="rounded-full wx-gradient px-2 py-0.5 text-xs font-semibold text-white">
                {off}% off
              </span>
            )}
            {off > 0 && (
              <span className="text-emerald-600">
                saves {formatMoney(savings(regularNum, wellxNum), currency)}
              </span>
            )}
          </div>
          {priceWarning && (
            <p role="alert" className="mt-2 text-sm font-semibold text-red-600">
              {priceWarning}
            </p>
          )}

          <div className="mt-4 rounded-xl border border-dashed border-wx-line p-3">
            <Field
              label="Commission"
              hint="Internal only — used for reporting and never shown to customers."
            >
              <input
                name="commission"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.commission ?? 0}
                className={`${inputClass} max-w-40`}
              />
            </Field>
          </div>
        </Card>

        {/* Fulfillment — the conditional fields */}
        <Card className="p-5">
          <h2 className="mb-1 font-bold">Fulfillment</h2>
          <p className="mb-4 text-sm text-neutral-600">
            Determines the customer experience and how the order is processed.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {FULFILLMENT_TYPES.map((t) => (
              <label
                key={t}
                className={`wx-focus flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-sm transition ${
                  type === t
                    ? "border-wx-purple bg-violet-50"
                    : "border-wx-line hover:border-wx-purple/40"
                }`}
              >
                <input
                  type="radio"
                  name="fulfillment_type"
                  value={t}
                  checked={type === t}
                  onChange={() => setType(t)}
                  className="mt-0.5 accent-violet-600"
                />
                <span>
                  <span className="block font-semibold">{FULFILLMENT_LABELS[t]}</span>
                  <span className="block text-xs text-wx-muted">{TYPE_HINTS[t]}</span>
                </span>
              </label>
            ))}
          </div>

          {type === "own_inventory" && (
            <div className="mt-4">
              <Field label="Stock quantity" hint="Leave empty for unlimited.">
                <input
                  name="stock_qty"
                  type="number"
                  min="0"
                  defaultValue={product?.stock_qty ?? ""}
                  className={`${inputClass} max-w-40`}
                />
              </Field>
            </div>
          )}

          {type === "drop_shipping" && (
            <div className="mt-4 rounded-xl bg-violet-50 p-4">
              <Field
                label="Vendor contact email"
                hint="Each paid order for this product is emailed here automatically."
              >
                <input
                  name="vendor_email"
                  type="email"
                  required
                  defaultValue={product?.vendor_email ?? ""}
                  placeholder="orders@vendor.com"
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          {type === "affiliate" && (
            <div className="mt-4 space-y-4 rounded-xl bg-violet-50 p-4">
              <p className="text-xs text-neutral-700">
                Affiliate products are never added to the cart. The customer copies the
                code and completes the purchase on the partner&rsquo;s site.
              </p>
              <Field label="Discount code" hint="Shown on the product page for the customer to copy.">
                <input
                  name="affiliate_code"
                  required
                  defaultValue={product?.affiliate_code ?? ""}
                  placeholder="WELLX20"
                  className={inputClass}
                />
              </Field>
              <Field label="Partner redirect link">
                <input
                  name="affiliate_url"
                  type="url"
                  required
                  defaultValue={product?.affiliate_url ?? ""}
                  placeholder="https://partner.com/product"
                  className={inputClass}
                />
              </Field>
            </div>
          )}
        </Card>

        {/* Media & presentation */}
        <Card className="p-5">
          <h2 className="mb-4 font-bold">Media & presentation</h2>
          <ImagePicker images={images} onChange={setImages} max={5} label="Images" />

          <div className="mt-5">
            <p className="mb-1 text-sm font-medium text-neutral-700">
              Badges <span className="font-normal text-wx-muted">({badges.length}/2)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...BADGE_SUGGESTIONS, ...badges])].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBadge(b)}
                  className={`wx-focus rounded-full px-3 py-1 text-xs font-semibold transition ${
                    badges.includes(b)
                      ? "wx-gradient text-white"
                      : "border border-wx-line bg-white text-neutral-600 hover:border-wx-purple"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Sort order" hint="Lower numbers appear first.">
              <input
                name="sort_order"
                type="number"
                defaultValue={product?.sort_order ?? 0}
                className={inputClass}
              />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={product?.is_active ?? true}
                className="h-4 w-4 accent-violet-600"
              />
              <span className="font-medium text-neutral-700">Active — visible on storefront</span>
            </label>
          </div>
        </Card>

        {state.error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </Button>
          <Link
            href="/admin/products"
            className="wx-focus rounded-full border border-wx-line bg-white px-4 py-2 text-sm font-semibold transition hover:border-wx-purple"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Live preview — the real storefront card, not a mock */}
      <aside className="xl:sticky xl:top-8 xl:h-fit">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-wx-muted">
          Live preview
        </p>
        <ProductCard
          interactive={false}
          product={{
            slug: "preview",
            name: name || "Product name",
            tagline,
            brandName,
            image: images[0],
            regular_price: regularNum,
            wellx_price: wellxNum,
            currency,
            badges,
          }}
        />
        <div className="mt-3 rounded-xl border border-wx-line bg-white p-3 text-xs">
          <p className="font-semibold">Product page CTA</p>
          <p className="mt-1 text-wx-muted">
            {cta.kind === "affiliate"
              ? "Shows the discount code and a link to the partner — no cart."
              : `"${cta.label}" — ${cta.note}`}
          </p>
        </div>
      </aside>
    </form>
  );
}

const TYPE_HINTS: Record<FulfillmentType, string> = {
  own_inventory: "We hold stock and ship it.",
  access_code: "You email a code after purchase.",
  drop_shipping: "Order is emailed to the vendor.",
  affiliate: "Customer buys on the partner's site.",
};
