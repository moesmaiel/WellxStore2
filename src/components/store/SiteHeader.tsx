"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function SiteHeader({ storeName }: { storeName: string }) {
  const { count, ready } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-wx-dark/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4 sm:px-6">
        <Link href="/" className="wx-focus rounded text-lg font-extrabold tracking-tight text-white">
          {storeName.replace(/ Store$/, "")}{" "}
          <span className="wx-gradient-text">Store</span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-5">
          <Link
            href="/shop"
            className="wx-focus rounded px-1 text-sm font-medium text-white/80 transition hover:text-white"
          >
            Shop
          </Link>
          <Link
            href="/#how-it-works"
            className="wx-focus hidden rounded px-1 text-sm font-medium text-white/80 transition hover:text-white sm:block"
          >
            How it works
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart${ready && count ? `, ${count} items` : ""}`}
            className="wx-focus relative rounded-full p-2 text-white transition hover:bg-white/10"
          >
            <ShoppingBag size={20} aria-hidden="true" />
            {ready && count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full wx-gradient px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}
