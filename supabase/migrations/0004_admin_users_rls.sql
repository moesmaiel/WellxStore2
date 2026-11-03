-- admin_users gets RLS enabled with no policies at all, same pattern as
-- orders/order_items/email_outbox in 0002_rls.sql: anon/authenticated get
-- zero access, only the service-role connection used by the app can touch it.
-- Guarded so this stays a no-op on the embedded local database, which has no
-- anon/authenticated roles.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    return;
  end if;

  alter table admin_users enable row level security;
end $$;
