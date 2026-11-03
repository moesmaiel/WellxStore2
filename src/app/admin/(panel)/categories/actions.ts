"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  countProductsInCategory,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/lib/repo";
import { query } from "@/lib/db";
import { slugify } from "@/lib/slug";

async function guard() {
  await requireAdmin();
}

export type ActionResult = { error?: string };

export async function addCategory(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await guard();
  const name = String(form.get("name") ?? "").trim();
  const parentId = String(form.get("parent_id") ?? "") || null;
  if (!name) return { error: "Name is required" };

  // Only two levels are supported: a subcategory can't have its own children.
  if (parentId) {
    const all = await listCategories();
    const parent = all.find((c) => c.id === parentId);
    if (parent?.parent_id) return { error: "Categories are only two levels deep" };
  }

  const existing = await listCategories();
  let slug = slugify(name);
  if (existing.some((c) => c.slug === slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const siblings = existing.filter((c) => c.parent_id === parentId);
  await createCategory({
    name,
    slug,
    parent_id: parentId,
    sort_order: siblings.length + 1,
  });
  revalidatePath("/admin/categories");
  return {};
}

export async function renameCategory(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await guard();
  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const sortOrder = Number(form.get("sort_order") ?? 0);
  if (!id || !name) return { error: "Name is required" };

  const all = await listCategories();
  const current = all.find((c) => c.id === id);
  let slug = slugify(name);
  if (all.some((c) => c.slug === slug && c.id !== id)) slug = current?.slug ?? slug;

  await updateCategory(id, { name, slug, sort_order: sortOrder });
  revalidatePath("/admin/categories");
  return {};
}

export async function removeCategory(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await guard();
  const id = String(form.get("id") ?? "");
  if (!id) return { error: "Missing category" };

  // Deleting a category that products still point at would silently orphan them.
  const inUse = await countProductsInCategory(id);
  if (inUse > 0) {
    return { error: `${inUse} product${inUse === 1 ? "" : "s"} still use this category` };
  }
  const children = (await listCategories()).filter((c) => c.parent_id === id);
  for (const child of children) {
    if ((await countProductsInCategory(child.id)) > 0) {
      return { error: `Products still use the "${child.name}" subcategory` };
    }
  }

  await deleteCategory(id);
  revalidatePath("/admin/categories");
  return {};
}

/** Move a category up or down within its own level. */
export async function moveCategory(form: FormData): Promise<void> {
  await guard();
  const id = String(form.get("id") ?? "");
  const direction = String(form.get("direction") ?? "");
  if (!id) return;

  const all = await listCategories();
  const self = all.find((c) => c.id === id);
  if (!self) return;

  const siblings = all
    .filter((c) => c.parent_id === self.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const index = siblings.findIndex((c) => c.id === id);
  const swapWith = direction === "up" ? siblings[index - 1] : siblings[index + 1];
  if (!swapWith) return;

  await query(`update categories set sort_order=$2 where id=$1`, [self.id, swapWith.sort_order]);
  await query(`update categories set sort_order=$2 where id=$1`, [swapWith.id, self.sort_order]);
  revalidatePath("/admin/categories");
}
