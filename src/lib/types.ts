export const FULFILLMENT_TYPES = [
  "own_inventory",
  "access_code",
  "drop_shipping",
  "affiliate",
] as const;
export type FulfillmentType = (typeof FULFILLMENT_TYPES)[number];

export type ItemStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "code_pending"
  | "code_sent"
  | "forwarded_to_vendor"
  | "vendor_confirmed"
  | "cancelled"
  | "refunded";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "partially_fulfilled"
  | "fulfilled"
  | "cancelled"
  | "refunded";

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  sort_order: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  brand_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  regular_price: number;
  wellx_price: number;
  currency: string | null;
  commission: number;
  fulfillment_type: FulfillmentType;
  vendor_email: string | null;
  affiliate_code: string | null;
  affiliate_url: string | null;
  images: string[];
  badges: string[];
  is_active: boolean;
  sort_order: number;
  stock_qty: number | null;
  created_at: string;
};

/** Product joined with its brand/category names, as returned by the storefront queries. */
export type ProductWithRefs = Product & {
  brand: Pick<Brand, "id" | "name" | "slug" | "logo_url"> | null;
  category: Pick<Category, "id" | "name" | "slug"> | null;
  subcategory: Pick<Category, "id" | "name" | "slug"> | null;
};

export type ShippingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
};

/** Frozen copy of the product at purchase time, so later admin edits never rewrite history. */
export type ProductSnapshot = {
  name: string;
  slug: string;
  brand_name: string | null;
  image: string | null;
  tagline: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_snapshot: ProductSnapshot;
  quantity: number;
  unit_regular_price: number;
  unit_wellx_price: number;
  unit_commission: number;
  fulfillment_type: FulfillmentType;
  status: ItemStatus;
  access_code: string | null;
  tracking_number: string | null;
  vendor_email: string | null;
  vendor_notified_at: string | null;
};

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: ShippingAddress;
  currency: string;
  subtotal: number;
  total: number;
  status: OrderStatus;
  payment_provider: string | null;
  payment_ref: string | null;
  created_at: string;
};

export type OrderWithItems = Order & { items: OrderItem[] };

export type AffiliateEventType = "code_viewed" | "code_copied" | "redirected";

export type Settings = {
  id: number;
  store_name: string;
  default_currency: string;
  enabled_currencies: string[];
};

export const ADMIN_ROLES = ["super_admin", "admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
};
