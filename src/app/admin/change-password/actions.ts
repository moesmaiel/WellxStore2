"use server";

import { redirect } from "next/navigation";
import { getCurrentAdmin, changeOwnPassword } from "@/lib/auth";

export type ActionResult = { error?: string };

export async function submitNewPassword(
  _prev: ActionResult,
  form: FormData
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match" };
  }

  await changeOwnPassword(password);
  redirect("/admin");
}
