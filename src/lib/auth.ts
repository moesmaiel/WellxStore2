import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { query, queryOne } from "./db";
import { hashPassword, verifyPassword } from "./password";
import type { AdminUser } from "./types";

/**
 * Per-user email+password sessions, backed by admin_users. The session
 * cookie carries only the user id — role, active status and
 * must_change_password are always re-read from the database on every
 * request, so deactivating a user or changing their role takes effect on
 * their very next request rather than waiting for the token to expire.
 */
const COOKIE = "wellx_admin";
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET must be set to at least 16 characters.");
  }
  return new TextEncoder().encode(s);
}

type AdminRow = AdminUser & { password_hash: string };

function stripHash(row: AdminRow): AdminUser {
  const { password_hash: _password_hash, ...rest } = row;
  return rest;
}

async function findAdminByEmail(email: string): Promise<AdminRow | null> {
  return queryOne<AdminRow>(`select * from admin_users where lower(email) = lower($1)`, [
    email,
  ]);
}

/** Verifies credentials and records the login. Returns null on any failure. */
export async function authenticate(
  email: string,
  password: string
): Promise<AdminUser | null> {
  const user = await findAdminByEmail(email);
  if (!user || !user.is_active) return null;
  if (!verifyPassword(password, user.password_hash)) return null;

  await query(`update admin_users set last_login_at = now() where id = $1`, [user.id]);
  return stripHash(user);
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

async function currentUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Authoritative session check: valid token AND a currently-active user row. */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const id = await currentUserId();
  if (!id) return null;
  const row = await queryOne<AdminRow>(`select * from admin_users where id = $1`, [id]);
  if (!row || !row.is_active) return null;
  return stripHash(row);
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentAdmin()) !== null;
}

/** Shared with proxy.ts, which cannot use next/headers or query the database. */
export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}

/**
 * Route/action guard: throws unless there is an active admin who has already
 * completed their forced password change. Every existing admin action calls
 * this so permission checks live at the server boundary, not just in the UI.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authorised");
  if (admin.must_change_password) {
    throw new Error("Set a new password before continuing");
  }
  return admin;
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "super_admin") {
    throw new Error("Super admin access required");
  }
  return admin;
}

/**
 * Used only by the forced change-password flow, which must work for a
 * session whose must_change_password flag is still true — requireAdmin()
 * would reject it.
 */
export async function changeOwnPassword(newPassword: string): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authorised");
  await query(
    `update admin_users set password_hash = $2, must_change_password = false, updated_at = now()
     where id = $1`,
    [admin.id, hashPassword(newPassword)]
  );
}

export const ADMIN_COOKIE = COOKIE;
