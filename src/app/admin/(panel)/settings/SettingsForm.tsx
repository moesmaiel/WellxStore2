"use client";

import { useActionState } from "react";
import { Card, Field, inputClass, Button } from "@/components/admin/ui";
import type { Settings } from "@/lib/types";
import { saveSettings } from "./actions";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettings, {});

  return (
    <Card className="max-w-xl p-5">
      <form action={action} className="space-y-4">
        <Field label="Store name">
          <input
            name="store_name"
            required
            defaultValue={settings.store_name}
            className={inputClass}
          />
        </Field>

        <Field
          label="Default currency"
          hint="Used by every product that doesn't set its own."
        >
          <input
            name="default_currency"
            required
            maxLength={3}
            defaultValue={settings.default_currency}
            className={`${inputClass} max-w-32 uppercase`}
          />
        </Field>

        <Field
          label="Enabled currencies"
          hint="Comma separated. These are the options offered on the product form."
        >
          <input
            name="enabled_currencies"
            defaultValue={settings.enabled_currencies.join(", ")}
            className={inputClass}
          />
        </Field>

        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">Settings saved.</p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </Card>
  );
}
