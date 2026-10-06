"use client";

import { formatClockTime, formatCountdown } from "@/lib/shop-live";
import AdelaideClock from "./AdelaideClock";
import { useShopNow } from "./useShopNow";
import { IconFlame } from "../Icons";

/**
 * The live pulse of the shop, as a glass card: Adelaide clock, are the
 * coals up, a ticking countdown to the close (or the next open), and the
 * last online slot still bookable. Server render is a calm skeleton, then
 * it wakes up on the first tick — no hydration drama, ever.
 */
export default function ShopPulse({ className = "" }: { className?: string }) {
  const now = useShopNow();

  return (
    <div className={`pulse-card ${className}`} data-tone="dark">
      <div className="pulse-card__top">
        <span className="eyebrow !text-amber !tracking-[0.18em]">
          <IconFlame className="h-3.5 w-3.5" /> Live from Hindley St
        </span>
        <AdelaideClock className="pulse-card__clock" />
      </div>

      <p className="pulse-card__state" role="status">
        {now === null ? (
          <>
            <span className="pulse-card__dot" aria-hidden="true" />
            Checking the coals…
          </>
        ) : now.open ? (
          <>
            <span className="pulse-card__dot is-lit" aria-hidden="true" />
            <b>The coals are up.</b> Open until {formatClockTime(now.today.close * 60)}.
          </>
        ) : (
          <>
            <span className="pulse-card__dot" aria-hidden="true" />
            <b>The fire is banked.</b> Lit again at {formatClockTime(now.boundaryMin * 60)}.
          </>
        )}
      </p>

      <div className="pulse-card__grid">
        <div className="pulse-card__stat">
          <span className="pulse-card__num">{now === null ? "—:——" : formatCountdown(now.secondsTo)}</span>
          <span className="pulse-card__lab">until we {now?.verb === "closes" ? "close" : "open"}</span>
        </div>
        <div className="pulse-card__stat">
          <span className="pulse-card__num">
            {now === null ? "—" : now.open ? (now.lastSlotMin !== null ? formatClockTime(now.lastSlotMin * 60) : "ASAP only") : now.firstSlotLabel}
          </span>
          <span className="pulse-card__lab">{now !== null && !now.open ? "first online slot" : "last timed online slot"}</span>
        </div>
        <div className="pulse-card__stat">
          <span className="pulse-card__num">{now === null ? "—" : now.open ? "Pay at the counter" : "Order ahead"}</span>
          <span className="pulse-card__lab">{now === null ? "" : now.open ? "nothing to pay online" : "wrapped for when doors go up"}</span>
        </div>
      </div>
    </div>
  );
}
