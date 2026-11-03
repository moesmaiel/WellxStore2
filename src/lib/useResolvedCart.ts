"use client";

import { useEffect, useState } from "react";
import { useCart } from "./cart";
import type { ResolvedLine } from "@/app/api/cart/resolve/route";

/**
 * Hydrates the id-and-quantity cart into full lines priced by the server.
 * Re-runs whenever the cart changes, so quantity edits re-price server-side.
 */
export function useResolvedCart() {
  const { lines, ready } = useCart();
  const [resolved, setResolved] = useState<ResolvedLine[]>([]);
  const [currency, setCurrency] = useState("AED");
  const [loading, setLoading] = useState(true);

  const key = JSON.stringify(lines);

  useEffect(() => {
    if (!ready || lines.length === 0) return;
    let cancelled = false;
    // Kicking off the fetch when the cart changes is exactly what this effect
    // is for; the loading flag just reflects that request being in flight.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch("/api/cart/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResolved(data.lines ?? []);
        if (data.currency) setCurrency(data.currency);
      })
      .catch(() => !cancelled && setResolved([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  // An empty cart needs no request; resolve straight to an empty result.
  if (ready && lines.length === 0) {
    return { resolved: [], currency, loading: false, ready };
  }
  return { resolved, currency, loading, ready };
}
