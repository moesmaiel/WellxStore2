import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug, getSettings } from "@/lib/repo";
import { PriceBlock } from "@/components/store/PriceBlock";
import { Badges } from "@/components/store/Badges";
import { ProductImage } from "@/components/store/ProductImage";
import { AddToCartButton } from "@/components/store/AddToCartButton";
import { AffiliateOffer } from "@/components/store/AffiliateOffer";
import { ctaFor } from "@/lib/fulfillment";
import { formatMoney, savings } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product || !product.is_active) notFound();

  const currency = product.currency ?? settings.default_currency;
  const cta = ctaFor(product.fulfillment_type);
  const outOfStock =
    product.fulfillment_type === "own_inventory" &&
    product.stock_qty !== null &&
    product.stock_qty <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-wx-muted">
        <Link href="/shop" className="wx-focus rounded hover:text-wx-purple">
          Shop
        </Link>
        {product.category && (
          <>
            {" / "}
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="wx-focus rounded hover:text-wx-purple"
            >
              {product.category.name}
            </Link>
          </>
        )}
        {product.subcategory && (
          <>
            {" / "}
            <Link
              href={`/shop?category=${product.subcategory.slug}`}
              className="wx-focus rounded hover:text-wx-purple"
            >
              {product.subcategory.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-3xl border border-wx-line bg-white">
            <ProductImage
              src={product.images[0]}
              alt={product.name}
              initials={product.brand?.name ?? product.name}
              className="aspect-square w-full"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {product.images.slice(1, 5).map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="overflow-hidden rounded-xl border border-wx-line bg-white"
                >
                  <ProductImage
                    src={src}
                    alt={`${product.name} view ${i + 2}`}
                    className="aspect-square w-full"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.brand && (
            <p className="text-sm font-bold uppercase tracking-wider text-wx-muted">
              {product.brand.name}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          {product.tagline && (
            <p className="mt-3 text-lg text-neutral-600">{product.tagline}</p>
          )}

          {product.badges.length > 0 && (
            <div className="mt-4">
              <Badges badges={product.badges} />
            </div>
          )}

          <div className="mt-7 rounded-2xl border border-wx-line bg-white p-5">
            <PriceBlock
              regular={product.regular_price}
              wellx={product.wellx_price}
              currency={currency}
              size="lg"
            />
            {savings(product.regular_price, product.wellx_price) > 0 && (
              <p className="mt-2 text-sm font-semibold text-emerald-600">
                You save {formatMoney(savings(product.regular_price, product.wellx_price), currency)}{" "}
                as a Wellx member
              </p>
            )}
          </div>

          {/* CTA — the only place the four fulfillment types diverge for the customer */}
          <div className="mt-6">
            {cta.kind === "affiliate" ? (
              <AffiliateOffer
                productId={product.id}
                code={product.affiliate_code ?? ""}
                url={product.affiliate_url ?? "#"}
                brandName={product.brand?.name ?? "the partner"}
              />
            ) : (
              <>
                <AddToCartButton
                  productId={product.id}
                  label={cta.label}
                  disabled={outOfStock}
                />
                {cta.note && !outOfStock && (
                  <p className="mt-3 text-center text-sm text-wx-muted">{cta.note}</p>
                )}
              </>
            )}
          </div>

          {product.description && (
            <div className="mt-8 border-t border-wx-line pt-8">
              <h2 className="mb-3 text-lg font-bold">About this product</h2>
              <p className="whitespace-pre-line leading-relaxed text-neutral-700">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
