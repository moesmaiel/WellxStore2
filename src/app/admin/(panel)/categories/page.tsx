import { listCategories, countProductsInCategory } from "@/lib/repo";
import { PageHeader } from "@/components/admin/ui";
import { CategoryManager } from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const all = await listCategories();
  const counts = Object.fromEntries(
    await Promise.all(all.map(async (c) => [c.id, await countProductsInCategory(c.id)] as const))
  );

  const tree = all
    .filter((c) => !c.parent_id)
    .map((c) => ({ ...c, children: all.filter((s) => s.parent_id === c.id) }));

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Two levels: a category and its subcategories. Order here is the order shown on the storefront."
      />
      <CategoryManager tree={tree} parents={all.filter((c) => !c.parent_id)} counts={counts} />
    </>
  );
}
