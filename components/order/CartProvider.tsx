"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/menu";
import { cartTotal, describe, lineKey, MAX_QTY, productById, unitPrice, type CartLine, type LineConfig } from "@/lib/order";

const STORAGE_KEY = "yiannis:cart:v2";
const LAST_ORDER_KEY = "yiannis:last-order";

/** What was just added — drives the little "flung onto the spit" toast. */
export type LastAdded = { seq: number; title: string; detail?: string; price: number };

type CartState = {
  lines: CartLine[];
  count: number;
  total: number;
  /** Bumps every time something is added — drives little "just added" animations. */
  pulse: number;
  add: (cfg: LineConfig, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** Open the option sheet for a product. */
  customise: (productId: string) => void;
  customising: Product | null;
  closeCustomiser: () => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  lastOrderId: string | null;
  setLastOrderId: (id: string | null) => void;
  lastAdded: LastAdded | null;
  dismissToast: () => void;
};

const Ctx = createContext<CartState | null>(null);

export function useCart(): CartState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [pulse, setPulse] = useState(0);
  const [lastAdded, setLastAdded] = useState<LastAdded | null>(null);
  const seq = useRef(0);
  const [customising, setCustomising] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastOrderId, setLastOrderIdState] = useState<string | null>(null);
  const loaded = useRef(false);

  // Restore the cart (and the last order, for "track your order").
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) setLines(saved.filter((l: CartLine) => productById(l?.productId)));
      setLastOrderIdState(localStorage.getItem(LAST_ORDER_KEY));
    } catch {}
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);

  const add = useCallback((cfg: LineConfig, qty = 1) => {
    const key = lineKey(cfg);
    setLines((ls) => {
      const hit = ls.find((l) => l.key === key);
      if (hit) return ls.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l));
      return [...ls, { ...cfg, key, qty: Math.min(MAX_QTY, qty) }];
    });
    setPulse((p) => p + 1);
    // Tell the toast what just went on the spit, priced by the menu.
    const p = productById(cfg.productId);
    if (p) {
      const d = describe(p, cfg);
      const n = qty * unitPrice(p, cfg);
      setLastAdded({ seq: ++seq.current, title: d.title, detail: d.detail || undefined, price: n });
    }
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((ls) => ls.flatMap((l) => (l.key !== key ? [l] : qty <= 0 ? [] : [{ ...l, qty: Math.min(MAX_QTY, qty) }])));
  }, []);

  const value = useMemo<CartState>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: cartTotal(lines),
      pulse,
      add,
      setQty,
      remove: (key) => setLines((ls) => ls.filter((l) => l.key !== key)),
      clear: () => setLines([]),
      customise: (id) => {
        const p = productById(id);
        if (p && !p.dineInOnly) setCustomising(p);
      },
      customising,
      closeCustomiser: () => setCustomising(null),
      checkoutOpen,
      setCheckoutOpen,
      sheetOpen,
      setSheetOpen,
      lastOrderId,
      setLastOrderId: (id) => {
        setLastOrderIdState(id);
        try {
          if (id) localStorage.setItem(LAST_ORDER_KEY, id);
          else localStorage.removeItem(LAST_ORDER_KEY);
        } catch {}
      },
      lastAdded,
      dismissToast: () => setLastAdded(null),
    }),
    [lines, pulse, add, setQty, customising, checkoutOpen, sheetOpen, lastOrderId, lastAdded]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
