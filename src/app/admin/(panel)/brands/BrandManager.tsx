"use client";

import { useActionState, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Card, Chip, inputClass } from "@/components/admin/ui";
import { ImagePicker } from "@/components/admin/ImagePicker";
import type { Brand } from "@/lib/types";
import { moveBrand, removeBrand, saveBrand, toggleBrandActive } from "./actions";

export function BrandManager({ brands }: { brands: Brand[] }) {
  const [editing, setEditing] = useState<Brand | "new" | null>(null);
  const [removeState, removeAction] = useActionState(removeBrand, {});

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <Card className="divide-y divide-wx-line">
        {brands.length === 0 && (
          <p className="p-8 text-center text-sm text-wx-muted">No brands yet.</p>
        )}
        {brands.map((brand) => (
          <div key={brand.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-wx-line bg-wx-bg">
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo_url} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs font-bold text-wx-muted">
                  {brand.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold">{brand.name}</p>
              {brand.website_url && (
                <p className="truncate text-xs text-wx-muted">{brand.website_url}</p>
              )}
            </div>

            <form action={toggleBrandActive}>
              <input type="hidden" name="id" value={brand.id} />
              <button type="submit" className="wx-focus rounded-full" title="Toggle active">
                <Chip tone={brand.is_active ? "green" : "neutral"}>
                  {brand.is_active ? "Active" : "Hidden"}
                </Chip>
              </button>
            </form>

            <div className="flex items-center gap-1">
              <MoveButton id={brand.id} direction="up" />
              <MoveButton id={brand.id} direction="down" />
              <button
                onClick={() => setEditing(brand)}
                aria-label={`Edit ${brand.name}`}
                className="wx-focus rounded-full p-1.5 text-wx-muted transition hover:bg-wx-bg hover:text-wx-ink"
              >
                <Pencil size={14} aria-hidden="true" />
              </button>
              <form action={removeAction}>
                <input type="hidden" name="id" value={brand.id} />
                <button
                  type="submit"
                  aria-label={`Delete ${brand.name}`}
                  className="wx-focus rounded-full p-1.5 text-wx-muted transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        ))}
        {removeState.error && (
          <p role="alert" className="bg-red-50 p-3 text-sm text-red-700">
            {removeState.error}
          </p>
        )}
      </Card>

      <div>
        {editing ? (
          <BrandForm
            key={editing === "new" ? "new" : editing.id}
            brand={editing === "new" ? null : editing}
            onDone={() => setEditing(null)}
          />
        ) : (
          <Button onClick={() => setEditing("new")} className="w-full">
            <span className="inline-flex items-center gap-1.5">
              <Plus size={14} aria-hidden="true" /> Add brand
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}

function BrandForm({ brand, onDone }: { brand: Brand | null; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveBrand, {});
  const [logo, setLogo] = useState<string[]>(brand?.logo_url ? [brand.logo_url] : []);

  // Close the panel once the action reports success.
  if (state.ok) queueMicrotask(onDone);

  return (
    <Card className="h-fit p-5">
      <h2 className="mb-4 font-bold">{brand ? "Edit brand" : "Add brand"}</h2>
      <form action={action} className="space-y-4">
        {brand && <input type="hidden" name="id" value={brand.id} />}
        <input type="hidden" name="logo_url" value={logo[0] ?? ""} />
        <input type="hidden" name="sort_order" value={brand?.sort_order ?? 0} />

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">Name</span>
          <input name="name" required defaultValue={brand?.name} className={inputClass} />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-neutral-700">Website URL</span>
          <input
            name="website_url"
            type="url"
            placeholder="https://"
            defaultValue={brand?.website_url ?? ""}
            className={inputClass}
          />
        </label>

        <ImagePicker images={logo} onChange={setLogo} max={1} label="Logo" />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={brand?.is_active ?? true}
            className="h-4 w-4 accent-violet-600"
          />
          <span className="font-medium text-neutral-700">
            Active — show on homepage partner strip
          </span>
        </label>

        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
            {state.error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Saving…" : "Save brand"}
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function MoveButton({ id, direction }: { id: string; direction: "up" | "down" }) {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  return (
    <form action={moveBrand}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        aria-label={`Move ${direction}`}
        className="wx-focus rounded-full p-1.5 text-wx-muted transition hover:bg-wx-bg hover:text-wx-ink"
      >
        <Icon size={14} aria-hidden="true" />
      </button>
    </form>
  );
}
