import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Images are written to public/uploads and served as /uploads/<name>.
 * Swap this one function for Supabase Storage (or S3) without touching callers:
 * upload, then return the public URL.
 */
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
  ["image/gif", "gif"],
]);

const MAX_BYTES = 5 * 1024 * 1024;

export async function saveUpload(file: File): Promise<string> {
  const ext = ALLOWED.get(file.type);
  if (!ext) throw new Error("Use a PNG, JPG, WEBP, SVG or GIF image.");
  if (file.size > MAX_BYTES) throw new Error("Images must be 5 MB or smaller.");

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(
    path.join(UPLOAD_DIR, name),
    Buffer.from(await file.arrayBuffer())
  );
  return `/uploads/${name}`;
}
