"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * The cart holds ids and quantities only. Prices, availability and fulfillment
 * type are always re-read from the server when rendering the cart and again at
 * checkout, so a stale localStorage cart can never lock in an old price.
 */
export type CartLine = { productId: string; quantity: number };

const KEY = "wellx.cart.v1";

type CartApi = {
  lines: CartLine[];
  /** Number of units in the cart. */
  count: number;
  ready: boolean;
  add: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartApi | null>(null);

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        typeof l?.productId === "string" && Number.isFinite(l?.quantity) && l.quantity > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate after mount so server and client markup match: localStorage isn't
  // available during SSR, so reading it during render would mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(read());
    setReady(true);
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode); cart stays in memory for this tab.
    }
    window.dispatchEvent(new Event("wellx:cart"));
  }, []);

  // Keep other tabs and other providers on this page in step.
  useEffect(() => {
    const sync = () => setLines(read());
    window.addEventListener("storage", sync);
    window.addEventListener("wellx:cart", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("wellx:cart", sync);
    };
  }, []);

  const api = useMemo<CartApi>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      add: (productId, quantity = 1) => {
        const current = read();
        const existing = current.find((l) => l.productId === productId);
        persist(
          existing
            ? current.map((l) =>
                l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l
              )
            : [...current, { productId, quantity }]
        );
      },
      setQuantity: (productId, quantity) => {
        const current = read();
        persist(
          quantity <= 0
            ? current.filter((l) => l.productId !== productId)
            : current.map((l) => (l.productId === productId ? { ...l, quantity } : l))
        );
      },
      remove: (productId) => persist(read().filter((l) => l.productId !== productId)),
      clear: () => persist([]),
    }),
    [lines, ready, persist]
  );

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart(): CartApi {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
