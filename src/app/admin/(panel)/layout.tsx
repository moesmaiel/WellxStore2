import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // proxy.ts guards optimistically; this is the authoritative check. The login
  // and change-password pages sit outside this route group, so they are
  // never wrapped by it and can't loop against these redirects.
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.must_change_password) redirect("/admin/change-password");

  return (
    <div className="flex min-h-screen flex-col bg-wx-bg lg:flex-row">
      <aside className="shrink-0 bg-wx-dark text-white lg:w-60">
        <div className="p-5">
          <Link href="/admin" className="wx-focus rounded text-lg font-extrabold tracking-tight">
            Wellx <span className="wx-gradient-text">Admin</span>
          </Link>
        </div>
        <AdminNav role={admin.role} />
        <div className="p-5">
          <p className="mb-2 truncate text-xs text-white/40" title={admin.email}>
            {admin.name} · {admin.role === "super_admin" ? "Super Admin" : "Admin"}
          </p>
          <form method="post" action="/api/admin/logout">
            <button className="wx-focus text-sm text-white/50 transition hover:text-white">
              Sign out
            </button>
          </form>
          <Link
            href="/"
            className="wx-focus mt-3 block text-sm text-white/50 transition hover:text-white"
          >
            View storefront →
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-8">{children}</main>
    </div>
  );
}
