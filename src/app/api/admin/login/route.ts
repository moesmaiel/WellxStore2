import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin");

  const admin = await authenticate(email, password);
  if (!admin) {
    return NextResponse.redirect(
      new URL(`/admin/login?error=1&next=${encodeURIComponent(next)}`, request.url),
      { status: 303 }
    );
  }

  await createSession(admin.id);

  if (admin.must_change_password) {
    return NextResponse.redirect(new URL("/admin/change-password", request.url), {
      status: 303,
    });
  }

  // Only allow relative paths, so ?next= can't be used as an open redirect.
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
  return NextResponse.redirect(new URL(target, request.url), { status: 303 });
}
