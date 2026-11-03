"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { Brand, Category } from "@/lib/types";

/**
 * Filters live in the URL so results are shareable and the grid stays a server
 * component. Every control just rewrites the query string.
 */
export function ShopFilters({
  categories,
  brands,
  resultCount,
}: {
  categories: (Category & { children: Category[] })[];
  brands: Brand[];
  resultCount: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const activeCategory = params.get("category");
  const activeBrand = params.get("brand");

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/shop${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };

  // Debounce typing so we don't push a history entry per keystroke.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (q === current) return;
    const t = setTimeout(() => setParam("q", q || null), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasFilters = Boolean(activeCategory || activeBrand || params.get("q"));

  return (
    <aside className="lg:sticky lg:top-24 lg:h-fit">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-wx-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products or brands"
          aria-label="Search products or brands"
          className="wx-focus w-full rounded-xl border border-wx-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none"
        />
      </div>

      <p className="mt-3 text-sm text-wx-muted">
        {resultCount} {resultCount === 1 ? "product" : "products"}
        {hasFilters && (
          <button
            onClick={() => router.push("/shop")}
            className="wx-focus ml-2 inline-flex items-center gap-1 rounded font-semibold text-wx-purple hover:underline"
          >
            <X size={12} aria-hidden="true" /> Clear
          </button>
        )}
      </p>

      <FilterGroup title="Category">
        <FilterButton
          label="All categories"
          active={!activeCategory}
          onClick={() => setParam("category", null)}
        />
        {categories.map((c) => (
          <div key={c.id}>
            <FilterButton
              label={c.name}
              active={activeCategory === c.slug}
              onClick={() => setParam("category", c.slug)}
            />
            {c.children.length > 0 && (
              <div className="ml-3 border-l border-wx-line pl-3">
                {c.children.map((s) => (
                  <FilterButton
                    key={s.id}
                    label={s.name}
                    small
                    active={activeCategory === s.slug}
                    onClick={() => setParam("category", s.slug)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </FilterGroup>

      <FilterGroup title="Brand">
        <FilterButton
          label="All brands"
          active={!activeBrand}
          onClick={() => setParam("brand", null)}
        />
        {brands.map((b) => (
          <FilterButton
            key={b.id}
            label={b.name}
            active={activeBrand === b.slug}
            onClick={() => setParam("brand", b.slug)}
          />
        ))}
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-wx-muted">{title}</h2>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
  small,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`wx-focus block w-full rounded-lg px-3 py-1.5 text-left transition ${
        small ? "text-[13px]" : "text-sm"
      } ${
        active
          ? "bg-wx-purple/10 font-semibold text-wx-purple"
          : "text-neutral-700 hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}
