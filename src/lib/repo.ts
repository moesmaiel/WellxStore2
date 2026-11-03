import "server-only";
import { query, queryOne, num } from "./db";
import type {
  Brand,
  Category,
  Order,
  OrderItem,
  OrderWithItems,
  Product,
  ProductWithRefs,
  Settings,
} from "./types";

/**
 * All catalog/order SQL lives here so pages and routes stay declarative.
 * Numeric columns come back from Postgres as strings, so every product/order
 * row is normalised through a mapper before it leaves this module.
 */

// --- mappers ---------------------------------------------------------------

type Row = Record<string, unknown>;

function mapProduct(r: Row): Product {
  return {
    ...(r as unknown as Product),
    regular_price: num(r.regular_price),
    wellx_price: num(r.wellx_price),
    commission: num(r.commission),
    images: (r.images as string[]) ?? [],
    badges: (r.badges as string[]) ?? [],
  };
}

function mapProductWithRefs(r: Row): ProductWithRefs {
  return {
    ...mapProduct(r),
    brand: r.brand_name
      ? {
          id: r.brand_id as string,
          name: r.brand_name as string,
          slug: r.brand_slug as string,
          logo_url: (r.brand_logo_url as string) ?? null,
        }
      : null,
    category: r.category_name
      ? {
          id: r.category_id as string,
          name: r.category_name as string,
          slug: r.category_slug as string,
        }
      : null,
    subcategory: r.subcategory_name
      ? {
          id: r.subcategory_id as string,
          name: r.subcategory_name as string,
          slug: r.subcategory_slug as string,
        }
      : null,
  };
}

function mapOrder(r: Row): Order {
  return {
    ...(r as unknown as Order),
    subtotal: num(r.subtotal),
    total: num(r.total),
  };
}

function mapOrderItem(r: Row): OrderItem {
  return {
    ...(r as unknown as OrderItem),
    quantity: num(r.quantity),
    unit_regular_price: num(r.unit_regular_price),
    unit_wellx_price: num(r.unit_wellx_price),
    unit_commission: num(r.unit_commission),
  };
}

const PRODUCT_SELECT = `
  select p.*,
         b.name as brand_name, b.slug as brand_slug, b.logo_url as brand_logo_url,
         c.name as category_name, c.slug as category_slug,
         s.name as subcategory_name, s.slug as subcategory_slug
  from products p
  left join brands b on b.id = p.brand_id
  left join categories c on c.id = p.category_id
  left join categories s on s.id = p.subcategory_id
`;

// --- settings --------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  const row = await queryOne<Settings>(`select * from settings where id = 1`);
  return (
    row ?? {
      id: 1,
      store_name: "Wellx Store",
      default_currency: "AED",
      enabled_currencies: ["AED", "USD", "GBP", "EUR"],
    }
  );
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await query(
    `update settings set
       store_name = coalesce($1, store_name),
       default_currency = coalesce($2, default_currency),
       enabled_currencies = coalesce($3, enabled_currencies)
     where id = 1`,
    [patch.store_name ?? null, patch.default_currency ?? null, patch.enabled_currencies ?? null]
  );
}

// --- categories ------------------------------------------------------------

export async function listCategories(): Promise<Category[]> {
  return query<Category>(
    `select * from categories order by coalesce(parent_id::text,''), sort_order, name`
  );
}

export async function listTopCategories(): Promise<Category[]> {
  return query<Category>(
    `select * from categories where parent_id is null order by sort_order, name`
  );
}

export async function createCategory(input: {
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
}): Promise<void> {
  await query(
    `insert into categories (name, slug, parent_id, sort_order) values ($1,$2,$3,$4)`,
    [input.name, input.slug, input.parent_id, input.sort_order]
  );
}

export async function updateCategory(
  id: string,
  input: { name: string; slug: string; sort_order: number }
): Promise<void> {
  await query(`update categories set name=$2, slug=$3, sort_order=$4 where id=$1`, [
    id,
    input.name,
    input.slug,
    input.sort_order,
  ]);
}

export async function deleteCategory(id: string): Promise<void> {
  await query(`delete from categories where id=$1`, [id]);
}

/** Products still pointing at a category, used to block deletion. */
export async function countProductsInCategory(id: string): Promise<number> {
  const r = await queryOne<{ n: string }>(
    `select count(*) as n from products where category_id=$1 or subcategory_id=$1`,
    [id]
  );
  return num(r?.n);
}

// --- brands ----------------------------------------------------------------

export async function listBrands(activeOnly = false): Promise<Brand[]> {
  return query<Brand>(
    `select * from brands ${activeOnly ? "where is_active" : ""} order by sort_order, name`
  );
}

export async function createBrand(input: Omit<Brand, "id">): Promise<void> {
  await query(
    `insert into brands (name, slug, logo_url, website_url, is_active, sort_order)
     values ($1,$2,$3,$4,$5,$6)`,
    [input.name, input.slug, input.logo_url, input.website_url, input.is_active, input.sort_order]
  );
}

export async function updateBrand(id: string, input: Omit<Brand, "id">): Promise<void> {
  await query(
    `update brands set name=$2, slug=$3, logo_url=$4, website_url=$5, is_active=$6, sort_order=$7
     where id=$1`,
    [id, input.name, input.slug, input.logo_url, input.website_url, input.is_active, input.sort_order]
  );
}

export async function deleteBrand(id: string): Promise<void> {
  await query(`delete from brands where id=$1`, [id]);
}

// --- products --------------------------------------------------------------

export type ProductFilters = {
  category?: string;   // slug, matches category or subcategory
  brand?: string;      // slug
  q?: string;          // product name or brand name
  activeOnly?: boolean;
};

export async function listProducts(f: ProductFilters = {}): Promise<ProductWithRefs[]> {
  const where: string[] = [];
  const params: unknown[] = [];

  if (f.activeOnly) where.push(`p.is_active`);
  if (f.category) {
    params.push(f.category);
    where.push(`(c.slug = $${params.length} or s.slug = $${params.length})`);
  }
  if (f.brand) {
    params.push(f.brand);
    where.push(`b.slug = $${params.length}`);
  }
  if (f.q) {
    params.push(`%${f.q}%`);
    where.push(`(p.name ilike $${params.length} or b.name ilike $${params.length} or p.tagline ilike $${params.length})`);
  }

  const rows = await query<Row>(
    `${PRODUCT_SELECT} ${where.length ? `where ${where.join(" and ")}` : ""}
     order by p.sort_order, p.created_at desc`,
    params
  );
  return rows.map(mapProductWithRefs);
}

export async function getProductBySlug(slug: string): Promise<ProductWithRefs | null> {
  const r = await queryOne<Row>(`${PRODUCT_SELECT} where p.slug = $1`, [slug]);
  return r ? mapProductWithRefs(r) : null;
}

export async function getProductById(id: string): Promise<ProductWithRefs | null> {
  const r = await queryOne<Row>(`${PRODUCT_SELECT} where p.id = $1`, [id]);
  return r ? mapProductWithRefs(r) : null;
}

/** Fetch the live rows behind a cart, so stale client prices are never trusted. */
export async function getProductsByIds(ids: string[]): Promise<ProductWithRefs[]> {
  if (ids.length === 0) return [];
  const rows = await query<Row>(`${PRODUCT_SELECT} where p.id = any($1::uuid[])`, [ids]);
  return rows.map(mapProductWithRefs);
}

export type ProductInput = Omit<Product, "id" | "created_at">;

export async function createProduct(input: ProductInput): Promise<string> {
  const r = await queryOne<{ id: string }>(
    `insert into products (
       name, slug, tagline, description, brand_id, category_id, subcategory_id,
       regular_price, wellx_price, currency, commission, fulfillment_type,
       vendor_email, affiliate_code, affiliate_url, images, badges,
       is_active, sort_order, stock_qty
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     returning id`,
    productParams(input)
  );
  return r!.id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await query(
    `update products set
       name=$1, slug=$2, tagline=$3, description=$4, brand_id=$5, category_id=$6,
       subcategory_id=$7, regular_price=$8, wellx_price=$9, currency=$10,
       commission=$11, fulfillment_type=$12, vendor_email=$13, affiliate_code=$14,
       affiliate_url=$15, images=$16, badges=$17, is_active=$18, sort_order=$19,
       stock_qty=$20, updated_at=now()
     where id=$21`,
    [...productParams(input), id]
  );
}

function productParams(i: ProductInput): unknown[] {
  return [
    i.name, i.slug, i.tagline, i.description, i.brand_id, i.category_id,
    i.subcategory_id, i.regular_price, i.wellx_price, i.currency, i.commission,
    i.fulfillment_type, i.vendor_email, i.affiliate_code, i.affiliate_url,
    i.images, i.badges, i.is_active, i.sort_order, i.stock_qty,
  ];
}

export async function deleteProduct(id: string): Promise<void> {
  await query(`delete from products where id=$1`, [id]);
}

// --- orders ----------------------------------------------------------------

export async function listOrders(): Promise<OrderWithItems[]> {
  const orders = (await query<Row>(`select * from orders order by created_at desc`)).map(mapOrder);
  if (orders.length === 0) return [];
  const items = (
    await query<Row>(`select * from order_items where order_id = any($1::uuid[]) order by created_at`, [
      orders.map((o) => o.id),
    ])
  ).map(mapOrderItem);
  return orders.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) }));
}

export async function getOrder(idOrNumber: string): Promise<OrderWithItems | null> {
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrNumber);
  const row = await queryOne<Row>(
    isUuid ? `select * from orders where id=$1` : `select * from orders where order_number=$1`,
    [idOrNumber]
  );
  if (!row) return null;
  const order = mapOrder(row);
  const items = (
    await query<Row>(`select * from order_items where order_id=$1 order by created_at`, [order.id])
  ).map(mapOrderItem);
  return { ...order, items };
}

export async function getOrderItem(id: string): Promise<OrderItem | null> {
  const r = await queryOne<Row>(`select * from order_items where id=$1`, [id]);
  return r ? mapOrderItem(r) : null;
}
