import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  // Already changed it (e.g. navigated back here manually) — nothing to do.
  if (!admin.must_change_password) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-wx-dark px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <p className="text-lg font-extrabold tracking-tight">
          Wellx <span className="wx-gradient-text">Store</span>
        </p>
        <h1 className="mt-1 text-2xl font-bold">Set a new password</h1>
        <p className="mt-2 text-sm text-neutral-600">
          You&rsquo;re signed in with a temporary password. Choose a new one to continue,{" "}
          {admin.name}.
        </p>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
