"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function AddToCartButton({
  productId,
  label,
  disabled,
}: {
  productId: string;
  label: string;
  disabled?: boolean;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (disabled) {
    return (
      <button
        disabled
        className="w-full cursor-not-allowed rounded-full bg-neutral-200 px-8 py-4 font-semibold text-neutral-500"
      >
        Out of stock
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          add(productId);
          setAdded(true);
          setTimeout(() => setAdded(false), 2500);
        }}
        className="wx-focus flex w-full items-center justify-center gap-2 rounded-full wx-gradient px-8 py-4 font-semibold text-white shadow-lg shadow-violet-200 transition hover:opacity-90"
      >
        {added ? <Check size={18} aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />}
        {added ? "Added to cart" : label}
      </button>
      {added && (
        <Link
          href="/cart"
          className="wx-focus block rounded-full border border-wx-line bg-white px-8 py-3 text-center font-semibold text-wx-ink transition hover:border-wx-purple"
        >
          Go to cart →
        </Link>
      )}
    </div>
  );
}
