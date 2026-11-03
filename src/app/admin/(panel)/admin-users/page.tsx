import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { PageHeader } from "@/components/admin/ui";
import type { AdminUser } from "@/lib/types";
import { AdminUserManager } from "./AdminUserManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  // Layout only checks "is a logged-in admin" — this page additionally
  // requires the Super Admin role, so a direct URL hit by a regular Admin is
  // blocked here too, not just hidden from the nav.
  const me = await getCurrentAdmin();
  if (!me || me.role !== "super_admin") redirect("/admin");

  const users = await query<AdminUser>(
    `select id, email, name, role, is_active, must_change_password, last_login_at, created_at
     from admin_users order by created_at asc`
  );

  return (
    <>
      <PageHeader
        title="Admin Users"
        subtitle="Only Super Admins can see or manage this section — enforced on every request, not just hidden in the nav."
      />
      <AdminUserManager users={users} currentUserId={me.id} />
    </>
  );
}
