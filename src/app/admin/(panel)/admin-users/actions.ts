"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { hashPassword, generatePassword } from "@/lib/password";
import { query, queryOne } from "@/lib/db";
import { ADMIN_ROLES, type AdminRole } from "@/lib/types";

export type ActionResult = { error?: string; tempPassword?: string; ok?: boolean };

function readRole(form: FormData): AdminRole {
  const v = String(form.get("role") ?? "");
  return (ADMIN_ROLES as readonly string[]).includes(v) ? (v as AdminRole) : "admin";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createAdminUser(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  await requireSuperAdmin();

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  const role = readRole(form);
  let tempPassword = String(form.get("temp_password") ?? "").trim();

  if (!email || !EMAIL_RE.test(email)) return { error: "Enter a valid email" };
  if (!name) return { error: "Name is required" };
  if (!tempPassword) tempPassword = generatePassword();
  if (tempPassword.length < 8) {
    return { error: "Temporary password must be at least 8 characters" };
  }

  const existing = await queryOne(
    `select id from admin_users where lower(email) = $1`,
    [email]
  );
  if (existing) return { error: "An admin with that email already exists" };

  await query(
    `insert into admin_users (email, name, password_hash, role, is_active, must_change_password)
     values ($1, $2, $3, $4, true, true)`,
    [email, name, hashPassword(tempPassword), role]
  );

  revalidatePath("/admin/admin-users");
  // Shown once in the UI so the inviting admin can hand it to the new user.
  return { tempPassword };
}

type TargetRow = { role: AdminRole; is_active: boolean };

export async function updateAdminUser(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const acting = await requireSuperAdmin();

  const id = String(form.get("id") ?? "");
  const role = readRole(form);
  const isActive = form.get("is_active") === "on";
  if (!id) return { error: "Missing admin user" };

  if (id === acting.id && !isActive) {
    return { error: "You can't deactivate your own account" };
  }
  if (id === acting.id && role !== "super_admin") {
    return { error: "You can't remove your own Super Admin role" };
  }

  const target = await queryOne<TargetRow>(
    `select role, is_active from admin_users where id = $1`,
    [id]
  );
  if (!target) return { error: "Admin user not found" };

  const losingSuperAdmin =
    target.role === "super_admin" && target.is_active && (role !== "super_admin" || !isActive);
  if (losingSuperAdmin) {
    const otherActiveSupers = await query<{ id: string }>(
      `select id from admin_users where role = 'super_admin' and is_active and id <> $1`,
      [id]
    );
    if (otherActiveSupers.length === 0) {
      return { error: "At least one active Super Admin must remain" };
    }
  }

  await query(
    `update admin_users set role = $2, is_active = $3, updated_at = now() where id = $1`,
    [id, role, isActive]
  );

  revalidatePath("/admin/admin-users");
  return { ok: true };
}

export async function resetAdminPassword(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  await requireSuperAdmin();

  const id = String(form.get("id") ?? "");
  if (!id) return { error: "Missing admin user" };

  const tempPassword = generatePassword();
  await query(
    `update admin_users
     set password_hash = $2, must_change_password = true, updated_at = now()
     where id = $1`,
    [id, hashPassword(tempPassword)]
  );

  revalidatePath("/admin/admin-users");
  return { tempPassword };
}
