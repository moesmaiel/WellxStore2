"use client";

import { useActionState } from "react";
import { submitNewPassword } from "./actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(submitNewPassword, {});

  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">New password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoFocus
          autoComplete="new-password"
          className="wx-focus w-full rounded-xl border border-wx-line px-3 py-2.5 outline-none"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-neutral-700">Confirm password</span>
        <input
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="wx-focus w-full rounded-xl border border-wx-line px-3 py-2.5 outline-none"
        />
      </label>

      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="wx-focus w-full rounded-full wx-gradient px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set password & continue"}
      </button>
    </form>
  );
}
