"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { removeProduct, toggleProductActive } from "./actions";

export function ProductRowActions({
  id,
  name,
  slug,
}: {
  id: string;
  name: string;
  slug: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <a
        href={`/product/${slug}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`View ${name} on the storefront`}
        className="wx-focus rounded-full p-1.5 text-wx-muted transition hover:bg-wx-bg hover:text-wx-ink"
      >
        <Eye size={15} aria-hidden="true" />
      </a>

      <form action={toggleProductActive}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          aria-label={`Toggle visibility of ${name}`}
          className="wx-focus rounded-full p-1.5 text-wx-muted transition hover:bg-wx-bg hover:text-wx-ink"
        >
          <EyeOff size={15} aria-hidden="true" />
        </button>
      </form>

      <form
        action={removeProduct}
        onSubmit={(e) => {
          if (!window.confirm(`Delete "${name}"? Past orders keep their own copy.`)) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          aria-label={`Delete ${name}`}
          className="wx-focus rounded-full p-1.5 text-wx-muted transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
