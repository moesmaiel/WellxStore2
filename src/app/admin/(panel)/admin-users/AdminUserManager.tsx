"use client";

import { useActionState, useState } from "react";
import { Copy, Check, KeyRound, Plus, ShieldCheck } from "lucide-react";
import { Button, Card, Chip, Field, inputClass } from "@/components/admin/ui";
import type { AdminUser } from "@/lib/types";
import { createAdminUser, resetAdminPassword, updateAdminUser } from "./actions";

export function AdminUserManager({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <Card className="divide-y divide-wx-line">
        {users.map((user) => (
          <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} />
        ))}
      </Card>

      <div>
        {adding ? (
          <NewUserForm onDone={() => setAdding(false)} />
        ) : (
          <Button onClick={() => setAdding(true)} className="w-full">
            <span className="inline-flex items-center gap-1.5">
              <Plus size={14} aria-hidden="true" /> Add admin user
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updating] = useActionState(updateAdminUser, {});
  const [resetState, resetAction, resetting] = useActionState(resetAdminPassword, {});

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full wx-gradient text-xs font-bold text-white">
          {user.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            {user.name}
            {isSelf && <span className="ml-1.5 text-xs font-normal text-wx-muted">(you)</span>}
          </p>
          <p className="truncate text-xs text-wx-muted">{user.email}</p>
        </div>

        <Chip tone={user.role === "super_admin" ? "purple" : "neutral"}>
          {user.role === "super_admin" ? (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={11} aria-hidden="true" /> Super Admin
            </span>
          ) : (
            "Admin"
          )}
        </Chip>
        <Chip tone={user.is_active ? "green" : "red"}>
          {user.is_active ? "Active" : "Inactive"}
        </Chip>
        {user.must_change_password && <Chip tone="amber">Pending first login</Chip>}

        <button
          onClick={() => setEditing((e) => !e)}
          className="wx-focus ml-auto rounded-full border border-wx-line bg-white px-3 py-1.5 text-xs font-semibold transition hover:border-wx-purple"
        >
          {editing ? "Close" : "Manage"}
        </button>
      </div>

      <p className="mt-2 pl-12 text-xs text-wx-muted">
        {user.last_login_at
          ? `Last login ${new Date(user.last_login_at).toLocaleString("en-GB")}`
          : "Never signed in"}
      </p>

      {editing && (
        <div className="mt-4 space-y-4 rounded-xl bg-wx-bg p-4">
          <form action={updateAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={user.id} />
            <Field label="Role" className="w-40">
              <select name="role" defaultValue={user.role} className={inputClass}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={user.is_active}
                className="h-4 w-4 accent-violet-600"
              />
              <span className="font-medium text-neutral-700">Active</span>
            </label>
            <Button type="submit" disabled={updating}>
              {updating ? "Saving…" : "Save changes"}
            </Button>
          </form>
          {updateState.error && (
            <p role="alert" className="text-xs text-red-700">
              {updateState.error}
            </p>
          )}

          <form action={resetAction} className="flex items-center gap-3 border-t border-wx-line pt-4">
            <input type="hidden" name="id" value={user.id} />
            <Button type="submit" variant="secondary" disabled={resetting}>
              <span className="inline-flex items-center gap-1.5">
                <KeyRound size={13} aria-hidden="true" />
                {resetting ? "Resetting…" : "Reset password"}
              </span>
            </Button>
            <p className="text-xs text-wx-muted">
              Issues a new temporary password; they&rsquo;ll be asked to set their own on next login.
            </p>
          </form>
          {resetState.tempPassword && <TempPasswordReveal password={resetState.tempPassword} />}
        </div>
      )}
    </div>
  );
}

function NewUserForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState(createAdminUser, {});

  if (state.tempPassword) {
    return (
      <Card className="p-5">
        <h2 className="mb-3 font-bold">Admin user created</h2>
        <TempPasswordReveal password={state.tempPassword} />
        <Button onClick={onDone} className="mt-4 w-full">
          Done
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-bold">Add admin user</h2>
      <form action={action} className="space-y-4">
        <Field label="Full name">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required autoComplete="off" className={inputClass} />
        </Field>
        <Field label="Role">
          <select name="role" defaultValue="admin" className={inputClass}>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </Field>
        <Field
          label="Temporary password"
          hint="Leave blank to generate one. They must set their own password on first login."
        >
          <input
            name="temp_password"
            type="text"
            autoComplete="off"
            placeholder="Leave blank to auto-generate"
            className={inputClass}
          />
        </Field>

        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
            {state.error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Creating…" : "Create admin user"}
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function TempPasswordReveal({ password }: { password: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border-2 border-dashed border-wx-purple/40 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-wx-muted">
        Temporary password — shown once
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-wx-bg px-3 py-2 text-sm font-bold tracking-wide">
          {password}
        </code>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(password);
            } catch {
              // Clipboard blocked — the password is on screen to copy manually.
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="wx-focus rounded-lg border border-wx-line p-2 transition hover:border-wx-purple"
          aria-label="Copy password"
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        </button>
      </div>
      <p className="mt-2 text-xs text-wx-muted">
        Share this with them directly. It won&rsquo;t be shown again.
      </p>
    </div>
  );
}
