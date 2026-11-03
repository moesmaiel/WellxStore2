import "server-only";
import fs from "node:fs";
import path from "node:path";
import { hashPassword, generatePassword } from "./password";

/**
 * One SQL surface, two drivers.
 *
 *  - DATABASE_URL set  -> node-postgres against that server (Supabase, Neon, RDS...).
 *  - DATABASE_URL unset -> PGlite, real Postgres compiled to WASM, persisted under
 *    .data/pgdata. Lets the whole app run with zero external setup.
 *
 * Both speak the same SQL, so supabase/migrations/*.sql is the single schema of record.
 */

export type QueryResult<T> = { rows: T[]; rowCount: number };

type Driver = {
  query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
  exec(sql: string): Promise<void>;
  kind: "postgres" | "pglite";
};

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");
const SEED_FILE = path.join(process.cwd(), "supabase", "seed.sql");

function migrationFiles(): { filename: string; sql: string }[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((filename) => ({
      filename,
      sql: fs.readFileSync(path.join(MIGRATIONS_DIR, filename), "utf8"),
    }));
}

async function createPostgresDriver(connectionString: string): Promise<Driver> {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString,
    // Supabase and most managed Postgres require TLS but present a chain
    // Node does not have a root for; the connection is still encrypted.
    ssl: connectionString.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
    max: 5,
  });
  const driver: Driver = {
    kind: "postgres",
    async query<T>(sql: string, params?: unknown[]) {
      const res = await pool.query(sql, params as never[]);
      return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
    },
    async exec(sql: string) {
      await pool.query(sql);
    },
  };
  // Migrations on a real deployment are expected to be applied externally
  // (supabase db push, CI, etc.) — this only seeds the first Super Admin,
  // and only if admin_users already exists and is empty.
  await ensureSuperAdmin(driver);
  return driver;
}

/**
 * Applies any migration file not yet recorded in _migrations, in filename
 * order. Safe to call on every boot: an already-bootstrapped local database
 * just picks up whatever migrations were added since it was last started,
 * instead of requiring a wipe every time the schema changes.
 */
async function runPendingMigrations(driver: Driver): Promise<{ freshDatabase: boolean }> {
  await driver.exec(
    `create table if not exists _migrations (
       filename text primary key,
       applied_at timestamptz not null default now()
     )`
  );
  const { rows: appliedRows } = await driver.query<{ filename: string }>(
    `select filename from _migrations`
  );
  const applied = new Set(appliedRows.map((r) => r.filename));
  const freshDatabase = applied.size === 0;

  for (const { filename, sql } of migrationFiles()) {
    if (applied.has(filename)) continue;
    await driver.exec(sql);
    await driver.query(`insert into _migrations (filename) values ($1)`, [filename]);
  }
  return { freshDatabase };
}

async function createPgliteDriver(): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = path.join(process.cwd(), ".data", "pgdata");
  fs.mkdirSync(path.dirname(dataDir), { recursive: true });
  const pg = new PGlite(dataDir);
  await pg.waitReady;

  const driver: Driver = {
    kind: "pglite",
    async query<T>(sql: string, params?: unknown[]) {
      const res = await pg.query<T>(sql, params as unknown[]);
      return { rows: res.rows, rowCount: res.rows.length };
    },
    async exec(sql: string) {
      await pg.exec(sql);
    },
  };

  const { freshDatabase } = await runPendingMigrations(driver);
  if (freshDatabase && fs.existsSync(SEED_FILE)) {
    await driver.exec(fs.readFileSync(SEED_FILE, "utf8"));
    console.log("[wellx] Local PGlite database created, migrated and seeded.");
  }
  await ensureSuperAdmin(driver);
  return driver;
}

/**
 * If no admin user exists yet, create the first Super Admin so the app is
 * never locked out. Email/password can be pinned via SEED_SUPER_ADMIN_EMAIL /
 * SEED_SUPER_ADMIN_PASSWORD; otherwise a password is generated and printed
 * once. The account is created with must_change_password=true, so whoever
 * logs in with it is forced to set their own password immediately.
 */
async function ensureSuperAdmin(driver: Driver): Promise<void> {
  let existing: QueryResult<{ id: string }>;
  try {
    existing = await driver.query<{ id: string }>(`select id from admin_users limit 1`);
  } catch {
    // admin_users doesn't exist yet — e.g. a Postgres/Supabase deployment
    // whose migrations haven't been applied externally. Nothing to seed.
    return;
  }
  if (existing.rows.length > 0) return;

  const email = (process.env.SEED_SUPER_ADMIN_EMAIL || "admin@wellx.store").toLowerCase();
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD || generatePassword();

  await driver.query(
    `insert into admin_users (email, name, password_hash, role, is_active, must_change_password)
     values ($1, $2, $3, 'super_admin', true, true)`,
    [email, "Super Admin", hashPassword(password)]
  );

  console.log("\n" + "=".repeat(64));
  console.log("[wellx] First Super Admin account created:");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log("  You'll be asked to set a new password on first login.");
  console.log("  Set SEED_SUPER_ADMIN_EMAIL / SEED_SUPER_ADMIN_PASSWORD in");
  console.log("  .env.local before first boot to pin these instead.");
  console.log("=".repeat(64) + "\n");
}

// Cached on globalThis so Next's dev hot-reload reuses one connection/instance.
const globalForDb = globalThis as unknown as { __wellxDb?: Promise<Driver> };

function getDriver(): Promise<Driver> {
  if (!globalForDb.__wellxDb) {
    const url = process.env.DATABASE_URL;
    const pending = url ? createPostgresDriver(url) : createPgliteDriver();
    // Don't cache a rejection — a misconfigured first attempt would otherwise
    // poison every later request until the server restarts.
    globalForDb.__wellxDb = pending.catch((err) => {
      globalForDb.__wellxDb = undefined;
      throw err;
    });
  }
  return globalForDb.__wellxDb;
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const driver = await getDriver();
  const res = await driver.query<T>(sql, params);
  return res.rows;
}

/** Returns the first row, or null. */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<number> {
  const driver = await getDriver();
  const res = await driver.query(sql, params);
  return res.rowCount;
}

export async function dbKind(): Promise<Driver["kind"]> {
  return (await getDriver()).kind;
}

/** Postgres returns numeric/decimal as strings; normalise at the boundary. */
export function num(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : Number(value);
}
