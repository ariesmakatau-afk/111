"use client";

import Link from "next/link";
import { formatClockTime, formatCountdown } from "@/lib/shop-live";
import { useShopNow } from "./useShopNow";
import { useCart } from "../order/CartProvider";
import { IconArrow, IconFlame } from "../Icons";

/**
 * The thin live bar under the menu's sticky nav: what the kitchen can do
 * for you *this minute* — how long until close, which online slots are
 * still on the board. Updates on a slow tick; the wording does the drama.
 */
export default function KitchenStrip() {
  const now = useShopNow(1000);
  const { lastOrderId } = useCart();

  if (!now) {
    return (
      <div className="kitchen-strip" data-tone="dark">
        <span className="kitchen-strip__txt">Checking the pass…</span>
      </div>
    );
  }

  return (
    <div className={`kitchen-strip ${now.lastCallSoon ? "is-lastcall" : ""}`} data-tone="dark">
      <div className="container-x flex min-h-[52px] flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
        <p className="kitchen-strip__txt flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <IconFlame className="h-4 w-4 shrink-0 text-amber" />
          {now.open ? (
            <>
              <span>
                <b>Open now</b>, carving until {formatClockTime(now.today.close * 60)}
              </span>
              <span className="kitchen-strip__count">{formatCountdown(now.secondsTo)}</span>
            </>
          ) : (
            <>
              <b>Kitchen&rsquo;s resting</b> — back at {formatClockTime(now.boundaryMin * 60)}, first online slot {now.firstSlotLabel}
            </>
          )}
        </p>
        <p className="kitchen-strip__slot">
          {now.open ? (
            now.lastSlotMin !== null ? (
              <>
                Last timed pickup <b>{formatClockTime(now.lastSlotMin * 60)}</b>
                <span className="mx-2 text-white/25">·</span>
                ASAP orders until close
              </>
            ) : (
              <>
                Timed slots are gone — <b>“as soon as possible”</b> is live until we bank the coals
              </>
            )
          ) : (
            <>You can still order — pick a time for the next session</>
          )}
          <span className="mx-2 hidden text-white/25 sm:inline">·</span>{" "}
          {lastOrderId ? (
            <Link href={`/order/status/${lastOrderId}`} className="inline-flex items-center gap-1 font-bold text-amber hover:text-white">
              Track your last order <IconArrow className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <a href="/#track" className="inline-flex items-center gap-1 font-bold text-amber hover:text-white">
              Already ordered? <IconArrow className="h-3.5 w-3.5" />
            </a>
          )}
        </p>
      </div>
    </div>
  );
}
