import { listBrands } from "@/lib/repo";
import { PageHeader } from "@/components/admin/ui";
import { BrandManager } from "./BrandManager";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brands = await listBrands();
  return (
    <>
      <PageHeader
        title="Brands & Partners"
        subtitle="Only Active brands appear in the partner logos strip on the homepage, in the order set here."
      />
      <BrandManager brands={brands} />
    </>
  );
}
