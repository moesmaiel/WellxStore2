-- Wellx Store — initial schema.
-- Runs verbatim on Supabase Postgres and on the embedded PGlite dev database.
-- gen_random_uuid() is core Postgres 13+, so no extensions are required.


-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type fulfillment_type as enum
    ('own_inventory','access_code','drop_shipping','affiliate');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_status as enum (
    'pending_payment','paid','processing','shipped','delivered',
    'code_pending','code_sent',
    'forwarded_to_vendor','vendor_confirmed',
    'cancelled','refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'pending_payment','paid','partially_fulfilled','fulfilled','cancelled','refunded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type affiliate_event_type as enum ('code_viewed','code_copied','redirected');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  parent_id   uuid references categories(id) on delete cascade,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists categories_parent_idx on categories(parent_id, sort_order);

create table if not exists brands (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  logo_url     text,
  website_url  text,
  is_active    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists brands_active_idx on brands(is_active, sort_order);

create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  tagline         text,
  description     text,
  brand_id        uuid references brands(id) on delete set null,
  category_id     uuid references categories(id) on delete set null,
  subcategory_id  uuid references categories(id) on delete set null,

  -- Regular price is the struck-through market price; wellx_price is what the
  -- member actually pays. Discount % is always derived, never stored.
  regular_price   numeric(12,2) not null check (regular_price >= 0),
  wellx_price     numeric(12,2) not null check (wellx_price >= 0),
  currency        text,                                    -- null -> settings.default_currency
  commission      numeric(12,2) not null default 0,        -- internal reporting only

  fulfillment_type fulfillment_type not null default 'own_inventory',
  vendor_email     text,       -- drop_shipping: where the order is emailed
  affiliate_code   text,       -- affiliate: the code the customer copies
  affiliate_url    text,       -- affiliate: partner site to redirect to

  images      text[] not null default '{}',
  badges      text[] not null default '{}',
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  stock_qty   integer,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint products_wellx_lte_regular check (wellx_price <= regular_price),
  constraint products_max_5_images check (array_length(images, 1) is null or array_length(images, 1) <= 5),
  constraint products_max_2_badges check (array_length(badges, 1) is null or array_length(badges, 1) <= 2),

  -- The conditional admin-form fields, enforced at the database level so the
  -- form and the data can never drift apart.
  constraint products_dropship_needs_vendor check (
    fulfillment_type <> 'drop_shipping'
    or (vendor_email is not null and vendor_email <> '')
  ),
  constraint products_affiliate_needs_code_and_url check (
    fulfillment_type <> 'affiliate'
    or (affiliate_code is not null and affiliate_code <> ''
        and affiliate_url is not null and affiliate_url <> '')
  )
);
create index if not exists products_active_idx on products(is_active, sort_order);
create index if not exists products_category_idx on products(category_id);
create index if not exists products_brand_idx on products(brand_id);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique,
  customer_name    text not null,
  customer_email   text not null,
  customer_phone   text,
  shipping_address jsonb not null default '{}'::jsonb,
  currency         text not null default 'AED',
  subtotal         numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  status           order_status not null default 'pending_payment',
  payment_provider text,
  payment_ref      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_created_idx on orders(created_at desc);

create table if not exists order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references orders(id) on delete cascade,
  product_id         uuid references products(id) on delete set null,
  -- Frozen product details, so editing a product later never rewrites history.
  product_snapshot   jsonb not null default '{}'::jsonb,
  quantity           integer not null default 1 check (quantity > 0),
  unit_regular_price numeric(12,2) not null,
  unit_wellx_price   numeric(12,2) not null,
  unit_commission    numeric(12,2) not null default 0,
  fulfillment_type   fulfillment_type not null,
  status             item_status not null default 'pending_payment',
  access_code        text,
  tracking_number    text,
  vendor_email       text,
  vendor_notified_at timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Affiliate products never become order lines; they are tracked as
  -- redemption events instead.
  constraint order_items_no_affiliate check (fulfillment_type <> 'affiliate')
);
create index if not exists order_items_order_idx on order_items(order_id);

-- ---------------------------------------------------------------------------
-- Affiliate redemption log (deliberately not part of the order pipeline)
-- ---------------------------------------------------------------------------
create table if not exists affiliate_events (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  event_type affiliate_event_type not null,
  session_id text,
  created_at timestamptz not null default now()
);
create index if not exists affiliate_events_product_idx on affiliate_events(product_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Outgoing mail. Rendered and recorded here rather than dispatched; swapping in
-- a real provider means sending queued rows and stamping sent_at.
-- ---------------------------------------------------------------------------
create table if not exists email_outbox (
  id         uuid primary key default gen_random_uuid(),
  to_address text not null,
  subject    text not null,
  template   text not null,
  payload    jsonb not null default '{}'::jsonb,
  body_html  text not null,
  status     text not null default 'queued',
  order_id   uuid references orders(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);
create index if not exists email_outbox_created_idx on email_outbox(created_at desc);

-- ---------------------------------------------------------------------------
-- Single-row store settings
-- ---------------------------------------------------------------------------
create table if not exists settings (
  id                 integer primary key default 1 check (id = 1),
  store_name         text not null default 'Wellx Store',
  default_currency   text not null default 'AED',
  enabled_currencies text[] not null default '{AED,USD,GBP,EUR}'
);
insert into settings (id) values (1) on conflict (id) do nothing;
