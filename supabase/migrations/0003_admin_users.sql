-- Admin user accounts and roles, replacing the single shared admin password.
-- Two roles: super_admin (full access, including managing other admins) and
-- admin (full access except the Admin Users section).

do $$ begin
  create type admin_role as enum ('super_admin', 'admin');
exception when duplicate_object then null; end $$;

create table if not exists admin_users (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null,
  name                  text not null,
  password_hash         text not null,
  role                  admin_role not null default 'admin',
  is_active             boolean not null default true,
  -- Forces a password reset on next login; set whenever a temporary
  -- password is issued (new account or admin-triggered reset).
  must_change_password  boolean not null default true,
  last_login_at         timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Case-insensitive uniqueness: the app always lowercases email before
-- insert/lookup, so this is the actual uniqueness boundary.
create unique index if not exists admin_users_email_lower_idx on admin_users (lower(email));
