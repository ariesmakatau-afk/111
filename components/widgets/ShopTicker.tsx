"use client";

import { countdownLabel, formatClockTime } from "@/lib/shop-live";
import { useShopNow } from "./useShopNow";
import AdelaideClock from "./AdelaideClock";

/**
 * One line, always current: the time in Adelaide and what the fire is
 * doing. Used in the footer — small, but it makes the whole page feel wired
 * to the shop.
 */
export default function ShopTicker({ className = "" }: { className?: string }) {
  const now = useShopNow(1000);

  return (
    <p className={`shop-ticker ${className}`}>
      <AdelaideClock className="shop-ticker__clock" />
      <span className="shop-ticker__sep" aria-hidden="true">
        ·
      </span>
      {now === null ? (
        <span>checking the coals…</span>
      ) : now.open ? (
        <span>
          open until <b>{formatClockTime(now.today.close * 60)}</b>
          <span className="shop-ticker__sep" aria-hidden="true">
            ·
          </span>
          <span className={now.lastCallSoon ? "text-amber font-bold" : ""}>{countdownLabel(now)}</span>
        </span>
      ) : (
        <span>
          coals banked · back at <b>{formatClockTime(now.boundaryMin * 60)}</b>
        </span>
      )}
    </p>
  );
}
