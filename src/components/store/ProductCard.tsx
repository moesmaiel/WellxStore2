import Link from "next/link";
import { PriceBlock } from "./PriceBlock";
import { Badges } from "./Badges";
import { ProductImage } from "./ProductImage";

export type ProductCardData = {
  slug: string;
  name: string;
  tagline?: string | null;
  brandName?: string | null;
  image?: string | null;
  regular_price: number;
  wellx_price: number;
  currency?: string | null;
  badges?: string[];
};

export function ProductCard({
  product,
  /** The admin live preview renders the same card without a working link. */
  interactive = true,
}: {
  product: ProductCardData;
  interactive?: boolean;
}) {
  const body = (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-wx-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-100">
      <div className="relative aspect-[4/3] overflow-hidden bg-wx-bg">
        <ProductImage
          src={product.image}
          alt={product.name}
          initials={product.brandName ?? product.name}
          className="h-full w-full transition duration-300 group-hover:scale-105"
        />
        {!!product.badges?.length && (
          <div className="absolute left-3 top-3">
            <Badges badges={product.badges} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.brandName && (
          <p className="text-xs font-semibold uppercase tracking-wider text-wx-muted">
            {product.brandName}
          </p>
        )}
        <h3 className="text-base leading-snug font-bold text-wx-ink">{product.name}</h3>
        {product.tagline && (
          <p className="line-clamp-2 text-sm text-neutral-600">{product.tagline}</p>
        )}

        <div className="mt-auto pt-3">
          <PriceBlock
            regular={product.regular_price}
            wellx={product.wellx_price}
            currency={product.currency ?? "AED"}
            size="sm"
          />
          <p className="mt-3 text-sm font-semibold text-wx-purple group-hover:underline">
            See details →
          </p>
        </div>
      </div>
    </article>
  );

  if (!interactive) return body;
  return (
    <Link href={`/product/${product.slug}`} className="wx-focus block h-full rounded-2xl">
      {body}
    </Link>
  );
}
