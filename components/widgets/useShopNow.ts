"use client";

import { useEffect, useState } from "react";
import { shopNow, type ShopNow } from "@/lib/shop-live";

/**
 * Live shop state, ticking in the browser on Adelaide time. Renders a
 * neutral null on the server so there's never a hydration mismatch —
 * every widget that uses it must handle `null` as "checking".
 */
export function useShopNow(tickMs = 1000): ShopNow | null {
  const [now, setNow] = useState<ShopNow | null>(null);

  useEffect(() => {
    const update = () => setNow(shopNow());
    update();
    const id = window.setInterval(update, tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  return now;
}
