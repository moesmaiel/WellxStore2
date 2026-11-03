"use client";

import { useActionState, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, Card, inputClass } from "@/components/admin/ui";
import type { Category } from "@/lib/types";
import { addCategory, moveCategory, removeCategory, renameCategory } from "./actions";

type Node = Category & { children: Category[] };

export function CategoryManager({
  tree,
  parents,
  counts,
}: {
  tree: Node[];
  parents: Category[];
  counts: Record<string, number>;
}) {
  const [addState, addAction, adding] = useActionState(addCategory, {});
  const [removeState, removeAction] = useActionState(removeCategory, {});

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Card className="divide-y divide-wx-line">
        {tree.length === 0 && (
          <p className="p-8 text-center text-sm text-wx-muted">No categories yet.</p>
        )}
        {tree.map((node) => (
          <div key={node.id} className="p-4">
            <Row category={node} count={counts[node.id] ?? 0} removeAction={removeAction} />
            {node.children.length > 0 && (
              <div className="ml-6 mt-2 space-y-2 border-l border-wx-line pl-4">
                {node.children.map((child) => (
                  <Row
                    key={child.id}
                    category={child}
                    count={counts[child.id] ?? 0}
                    removeAction={removeAction}
                    small
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {removeState.error && (
          <p role="alert" className="bg-red-50 p-3 text-sm text-red-700">
            {removeState.error}
          </p>
        )}
      </Card>

      <Card className="h-fit p-5">
        <h2 className="mb-4 font-bold">Add category</h2>
        <form action={addAction} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-neutral-700">Name</span>
            <input name="name" required className={inputClass} placeholder="e.g. Recovery" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-neutral-700">Parent</span>
            <select name="parent_id" className={inputClass} defaultValue="">
              <option value="">— Top level —</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {addState.error && (
            <p role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
              {addState.error}
            </p>
          )}
          <Button type="submit" disabled={adding} className="w-full">
            <span className="inline-flex items-center gap-1.5">
              <Plus size={14} aria-hidden="true" /> {adding ? "Adding…" : "Add category"}
            </span>
          </Button>
        </form>
      </Card>
    </div>
  );
}

function Row({
  category,
  count,
  removeAction,
  small,
}: {
  category: Category;
  count: number;
  removeAction: (form: FormData) => void;
  small?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [renameState, renameAction] = useActionState(renameCategory, {});

  if (editing) {
    return (
      <form
        action={(fd) => {
          renameAction(fd);
          setEditing(false);
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input type="hidden" name="id" value={category.id} />
        <input type="hidden" name="sort_order" value={category.sort_order} />
        <input
          name="name"
          defaultValue={category.name}
          autoFocus
          className={`${inputClass} max-w-xs flex-1`}
        />
        <Button type="submit">Save</Button>
        <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
          <X size={14} aria-hidden="true" />
        </Button>
        {renameState.error && (
          <span className="text-xs text-red-700">{renameState.error}</span>
        )}
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={small ? "text-sm" : "font-semibold"}>{category.name}</span>
      <code className="rounded bg-wx-bg px-1.5 py-0.5 text-[11px] text-wx-muted">
        /{category.slug}
      </code>
      <span className="text-xs text-wx-muted">
        {count} {count === 1 ? "product" : "products"}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <MoveButton id={category.id} direction="up" />
        <MoveButton id={category.id} direction="down" />
        <button
          onClick={() => setEditing(true)}
          aria-label={`Rename ${category.name}`}
          className="wx-focus rounded-full p-1.5 text-wx-muted transition hover:bg-wx-bg hover:text-wx-ink"
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
        <form action={removeAction}>
          <input type="hidden" name="id" value={category.id} />
          <button
            type="submit"
            aria-label={`Delete ${category.name}`}
            className="wx-focus rounded-full p-1.5 text-wx-muted transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}

function MoveButton({ id, direction }: { id: string; direction: "up" | "down" }) {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  return (
    <form action={moveCategory}>
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
