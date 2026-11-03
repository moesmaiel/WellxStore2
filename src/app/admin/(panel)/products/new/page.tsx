import { listBrands, listCategories, getSettings } from "@/lib/repo";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, brands, settings] = await Promise.all([
    listCategories(),
    listBrands(),
    getSettings(),
  ]);

  return (
    <>
      <PageHeader title="New product" subtitle="The preview shows exactly what customers will see." />
      <ProductForm
        product={null}
        categories={categories}
        brands={brands}
        defaultCurrency={settings.default_currency}
        currencies={settings.enabled_currencies}
      />
    </>
  );
}
