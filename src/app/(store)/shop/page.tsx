import { Suspense } from "react";
import { listBrands, listCategories, listProducts } from "@/lib/repo";
import { ProductCard } from "@/components/store/ProductCard";
import { ShopFilters } from "./ShopFilters";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopPage(props: PageProps<"/shop">) {
  const sp = await props.searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const filters = {
    category: one(sp.category),
    brand: one(sp.brand),
    q: one(sp.q),
    activeOnly: true,
  };

  const [products, allCategories, brands] = await Promise.all([
    listProducts(filters),
    listCategories(),
    listBrands(true),
  ]);

  // Nest subcategories under their parent for the filter tree.
  const tree: (Category & { children: Category[] })[] = allCategories
    .filter((c) => !c.parent_id)
    .map((c) => ({
      ...c,
      children: allCategories.filter((s) => s.parent_id === c.id),
    }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Shop</h1>
        <p className="mt-2 text-neutral-600">
          Every price below is what it actually costs — no catch.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <Suspense fallback={<div className="text-sm text-wx-muted">Loading filters…</div>}>
          <ShopFilters categories={tree} brands={brands} resultCount={products.length} />
        </Suspense>

        <div>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-wx-line bg-white p-12 text-center">
              <p className="font-semibold">No products match those filters.</p>
              <p className="mt-1 text-sm text-wx-muted">
                Try clearing the search or picking a different category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    slug: p.slug,
                    name: p.name,
                    tagline: p.tagline,
                    brandName: p.brand?.name,
                    image: p.images[0],
                    regular_price: p.regular_price,
                    wellx_price: p.wellx_price,
                    currency: p.currency,
                    badges: p.badges,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
