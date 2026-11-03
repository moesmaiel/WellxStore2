import { notFound } from "next/navigation";
import { getProductById, listBrands, listCategories, getSettings } from "@/lib/repo";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  const [product, categories, brands, settings] = await Promise.all([
    getProductById(id),
    listCategories(),
    listBrands(),
    getSettings(),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader title={product.name} subtitle="Edit product" />
      <ProductForm
        product={product}
        categories={categories}
        brands={brands}
        defaultCurrency={settings.default_currency}
        currencies={settings.enabled_currencies}
      />
    </>
  );
}
