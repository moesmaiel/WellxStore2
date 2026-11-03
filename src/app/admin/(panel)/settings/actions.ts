"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { updateSettings } from "@/lib/repo";

export type ActionResult = { error?: string; ok?: boolean };

export async function saveSettings(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAdmin();

  const storeName = String(form.get("store_name") ?? "").trim();
  const defaultCurrency = String(form.get("default_currency") ?? "").trim().toUpperCase();
  const enabled = String(form.get("enabled_currencies") ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);

  if (!storeName) return { error: "Store name is required" };
  if (!/^[A-Z]{3}$/.test(defaultCurrency)) {
    return { error: "Default currency must be a 3-letter code, e.g. AED" };
  }
  if (!enabled.includes(defaultCurrency)) enabled.unshift(defaultCurrency);

  await updateSettings({
    store_name: storeName,
    default_currency: defaultCurrency,
    enabled_currencies: enabled,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
