export const dynamic = "force-dynamic";

export default async function AdminLoginPage(props: PageProps<"/admin/login">) {
  const sp = await props.searchParams;
  const failed = sp.error === "1";
  const next = typeof sp.next === "string" ? sp.next : "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-wx-dark px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <p className="text-lg font-extrabold tracking-tight">
          Wellx <span className="wx-gradient-text">Store</span>
        </p>
        <h1 className="mt-1 text-2xl font-bold">Admin sign in</h1>

        <form method="post" action="/api/admin/login" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-neutral-700">Email</span>
            <input
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="username"
              className="wx-focus w-full rounded-xl border border-wx-line px-3 py-2.5 outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-neutral-700">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="wx-focus w-full rounded-xl border border-wx-line px-3 py-2.5 outline-none"
            />
          </label>

          {failed && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Incorrect email or password.
            </p>
          )}

          <button
            type="submit"
            className="wx-focus w-full rounded-full wx-gradient px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
