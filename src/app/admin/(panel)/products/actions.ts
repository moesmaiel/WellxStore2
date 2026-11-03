"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  type ProductInput,
} from "@/lib/repo";
import { query } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { FULFILLMENT_TYPES } from "@/lib/types";

async function guard() {
  await requireAdmin();
}

export type ActionResult = { error?: string };

/**
 * Conditional requirements mirror the database check constraints exactly:
 * drop shipping needs a vendor email, affiliate needs a code and a URL.
 */
const ProductSchema = z
  .object({
    name: z.string().trim().min(1, "Product name is required").max(200),
    tagline: z.string().trim().max(300).optional(),
    description: z.string().trim().max(5000).optional(),
    brand_id: z.string().optional(),
    category_id: z.string().optional(),
    subcategory_id: z.string().optional(),
    regular_price: z.number().min(0, "Regular price must be 0 or more"),
    wellx_price: z.number().min(0, "Wellx price must be 0 or more"),
    currency: z.string().optional(),
    commission: z.number().min(0).default(0),
    fulfillment_type: z.enum(FULFILLMENT_TYPES),
    vendor_email: z.string().trim().optional(),
    affiliate_code: z.string().trim().optional(),
    affiliate_url: z.string().trim().optional(),
    images: z.array(z.string()).max(5, "Up to 5 images"),
    badges: z.array(z.string()).max(2, "Up to 2 badges"),
    is_active: z.boolean(),
    sort_order: z.number().int().default(0),
    stock_qty: z.number().int().min(0).nullable(),
  })
  .refine((d) => d.wellx_price <= d.regular_price, {
    message: "Wellx price must be lower than the regular price",
    path: ["wellx_price"],
  })
  .refine(
    (d) => d.fulfillment_type !== "drop_shipping" || !!d.vendor_email,
    { message: "Drop shipping needs a vendor contact email", path: ["vendor_email"] }
  )
  .refine(
    (d) => d.fulfillment_type !== "drop_shipping" || /.+@.+\..+/.test(d.vendor_email ?? ""),
    { message: "Enter a valid vendor email", path: ["vendor_email"] }
  )
  .refine(
    (d) => d.fulfillment_type !== "affiliate" || !!d.affiliate_code,
    { message: "Affiliate products need a discount code", path: ["affiliate_code"] }
  )
  .refine(
    (d) => d.fulfillment_type !== "affiliate" || !!d.affiliate_url,
    { message: "Affiliate products need a partner redirect link", path: ["affiliate_url"] }
  );

function parse(form: FormData) {
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const numOrNull = (k: string) => {
    const v = str(k);
    return v === "" ? null : Number(v);
  };

  return ProductSchema.safeParse({
    name: str("name"),
    tagline: str("tagline"),
    description: str("description"),
    brand_id: str("brand_id"),
    category_id: str("category_id"),
    subcategory_id: str("subcategory_id"),
    regular_price: Number(str("regular_price") || 0),
    wellx_price: Number(str("wellx_price") || 0),
    currency: str("currency"),
    commission: Number(str("commission") || 0),
    fulfillment_type: str("fulfillment_type"),
    vendor_email: str("vendor_email"),
    affiliate_code: str("affiliate_code"),
    affiliate_url: str("affiliate_url"),
    images: JSON.parse(str("images") || "[]"),
    badges: JSON.parse(str("badges") || "[]"),
    is_active: form.get("is_active") === "on",
    sort_order: Number(str("sort_order") || 0),
    stock_qty: numOrNull("stock_qty"),
  });
}

export async function saveProduct(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await guard();
  const parsed = parse(form);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }
  const d = parsed.data;
  const id = String(form.get("id") ?? "");

  const all = await listProducts();
  let slug = slugify(d.name);
  if (all.some((p) => p.slug === slug && p.id !== id)) {
    slug = id
      ? (all.find((p) => p.id === id)?.slug ?? slug)
      : `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const input: ProductInput = {
    name: d.name,
    slug,
    tagline: d.tagline || null,
    description: d.description || null,
    brand_id: d.brand_id || null,
    category_id: d.category_id || null,
    subcategory_id: d.subcategory_id || null,
    regular_price: d.regular_price,
    wellx_price: d.wellx_price,
    currency: d.currency || null,
    commission: d.commission,
    fulfillment_type: d.fulfillment_type,
    // Clear fields belonging to the other fulfillment types, so switching type
    // never leaves stale data behind.
    vendor_email: d.fulfillment_type === "drop_shipping" ? d.vendor_email || null : null,
    affiliate_code: d.fulfillment_type === "affiliate" ? d.affiliate_code || null : null,
    affiliate_url: d.fulfillment_type === "affiliate" ? d.affiliate_url || null : null,
    images: d.images,
    badges: d.badges.filter(Boolean),
    is_active: d.is_active,
    sort_order: d.sort_order,
    stock_qty: d.fulfillment_type === "own_inventory" ? d.stock_qty : null,
    updated_at: new Date().toISOString(),
  } as ProductInput;

  try {
    if (id) await updateProduct(id, input);
    else await createProduct(input);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save product" };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function removeProduct(form: FormData): Promise<void> {
  await guard();
  const id = String(form.get("id") ?? "");
  if (!id) return;
  // Keep order history intact: order_items.product_id is ON DELETE SET NULL and
  // each line already carries its own product snapshot.
  await deleteProduct(id);
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function toggleProductActive(form: FormData): Promise<void> {
  await guard();
  const id = String(form.get("id") ?? "");
  if (!id) return;
  await query(`update products set is_active = not is_active, updated_at=now() where id=$1`, [id]);
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}
