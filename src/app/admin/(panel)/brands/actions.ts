"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createBrand, deleteBrand, listBrands, updateBrand } from "@/lib/repo";
import { query } from "@/lib/db";
import { slugify } from "@/lib/slug";

async function guard() {
  await requireAdmin();
}

export type ActionResult = { error?: string; ok?: boolean };

function readBrand(form: FormData) {
  return {
    name: String(form.get("name") ?? "").trim(),
    logo_url: String(form.get("logo_url") ?? "").trim() || null,
    website_url: String(form.get("website_url") ?? "").trim() || null,
    is_active: form.get("is_active") === "on" || form.get("is_active") === "true",
    sort_order: Number(form.get("sort_order") ?? 0) || 0,
  };
}

export async function saveBrand(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await guard();
  const id = String(form.get("id") ?? "");
  const input = readBrand(form);
  if (!input.name) return { error: "Name is required" };

  const all = await listBrands();
  let slug = slugify(input.name);
  if (all.some((b) => b.slug === slug && b.id !== id)) {
    slug = id ? (all.find((b) => b.id === id)?.slug ?? slug) : `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  if (id) {
    await updateBrand(id, { ...input, slug });
  } else {
    await createBrand({ ...input, slug, sort_order: input.sort_order || all.length + 1 });
  }

  revalidatePath("/admin/brands");
  revalidatePath("/");
  return { ok: true };
}

export async function removeBrand(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await guard();
  const id = String(form.get("id") ?? "");
  if (!id) return { error: "Missing brand" };

  const rows = await query<{ n: string }>(
    `select count(*) as n from products where brand_id=$1`,
    [id]
  );
  const inUse = Number(rows[0]?.n ?? 0);
  if (inUse > 0) {
    return { error: `${inUse} product${inUse === 1 ? "" : "s"} still use this brand` };
  }

  await deleteBrand(id);
  revalidatePath("/admin/brands");
  revalidatePath("/");
  return { ok: true };
}

/** Active toggle — drives whether the logo shows on the homepage. */
export async function toggleBrandActive(form: FormData): Promise<void> {
  await guard();
  const id = String(form.get("id") ?? "");
  if (!id) return;
  await query(`update brands set is_active = not is_active where id=$1`, [id]);
  revalidatePath("/admin/brands");
  revalidatePath("/");
}

export async function moveBrand(form: FormData): Promise<void> {
  await guard();
  const id = String(form.get("id") ?? "");
  const direction = String(form.get("direction") ?? "");
  const all = (await listBrands()).sort((a, b) => a.sort_order - b.sort_order);
  const index = all.findIndex((b) => b.id === id);
  if (index < 0) return;
  const swapWith = direction === "up" ? all[index - 1] : all[index + 1];
  if (!swapWith) return;

  await query(`update brands set sort_order=$2 where id=$1`, [all[index].id, swapWith.sort_order]);
  await query(`update brands set sort_order=$2 where id=$1`, [swapWith.id, all[index].sort_order]);
  revalidatePath("/admin/brands");
  revalidatePath("/");
}
