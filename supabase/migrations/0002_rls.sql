-- Row Level Security.
--
-- The app itself talks to Postgres as the owner through server-side routes, so
-- these policies are defence in depth: they make sure that if Supabase's
-- PostgREST/anon API is ever exposed, the public can read only the active
-- catalog and nothing else. Orders, commission, outbox and affiliate logs stay
-- server-only.
--
-- The `anon`/`authenticated` roles only exist on Supabase, so everything is
-- guarded to stay a no-op on the embedded local database.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    return;
  end if;

  alter table categories       enable row level security;
  alter table brands           enable row level security;
  alter table products         enable row level security;
  alter table orders           enable row level security;
  alter table order_items      enable row level security;
  alter table affiliate_events enable row level security;
  alter table email_outbox     enable row level security;
  alter table settings         enable row level security;

  -- Public, read-only, active rows only.
  drop policy if exists categories_public_read on categories;
  create policy categories_public_read on categories
    for select to anon, authenticated using (true);

  drop policy if exists brands_public_read on brands;
  create policy brands_public_read on brands
    for select to anon, authenticated using (is_active);

  drop policy if exists products_public_read on products;
  create policy products_public_read on products
    for select to anon, authenticated using (is_active);

  drop policy if exists settings_public_read on settings;
  create policy settings_public_read on settings
    for select to anon, authenticated using (true);

  -- orders, order_items, affiliate_events and email_outbox get no policies at
  -- all, so RLS denies the anon role by default.
end $$;
