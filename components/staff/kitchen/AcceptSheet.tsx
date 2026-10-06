"use client";

import { useEffect, useRef, useState } from "react";
import { igniteAt } from "@/lib/embers";
import { playConfirm } from "@/lib/alertSounds";
import Sheet from "../../order/Sheet";
import { DEFAULT_WAIT, WAIT_OPTIONS, bump, itemCount, type Order } from "./types";

/**
 * Accepting is two deliberate steps: pick the wait, then press Accept.
 * Picking a time never accepts on its own. The Accept press is the reward —
 * the button sinks, sparks fly, the tablet buzzes and chimes, then it closes.
 */
export default function AcceptSheet({
  order,
  busy,
  onClose,
  onAccept,
}: {
  order: Order | null;
  busy: number;
  onClose: () => void;
  onAccept: (order: Order, waitMinutes: number) => void;
}) {
  const [wait, setWait] = useState(DEFAULT_WAIT);
  const [done, setDone] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    if (order) {
      setWait(order.wait_minutes ?? DEFAULT_WAIT);
      setDone(false);
    }
    return () => window.clearTimeout(timer.current);
  }, [order]);

  if (!order) return null;

  function confirm(e: React.MouseEvent<HTMLButtonElement>) {
    if (!order || done) return;
    igniteAt(e.currentTarget, 40, 1.2);
    playConfirm();
    bump([18, 40, 30]);
    setDone(true);
    const accepted = order;
    timer.current = window.setTimeout(() => onAccept(accepted, wait), 650);
  }

  const n = itemCount(order);
  return (
    <Sheet open onClose={done ? () => {} : onClose} label={`Accept ${order.customer_name}'s order`} tone="dark">
      <div className="overflow-y-auto p-6 pt-7 sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/50">Accept order</p>
        <h2 className="mt-2 pr-12 font-serif text-4xl leading-none">{order.customer_name}</h2>
        <p className="mt-2 text-sm text-white/60">
          {n} {n === 1 ? "item" : "items"} · pickup <b className="text-white">{order.pickup_time}</b>
        </p>

        <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.18em] text-white/50">How long?</p>
        <div className="mt-3 flex items-center justify-center gap-5">
          <button
            type="button"
            aria-label="Five minutes less"
            disabled={wait <= 5 || done}
            onClick={() => {
              bump([8]);
              setWait((w) => Math.max(5, w - 5));
            }}
            className="press-btn grid h-14 w-14 place-items-center rounded-full border border-white/25 text-2xl font-bold"
          >
            −
          </button>
          <p className="min-w-[8rem] text-center font-serif text-6xl tabular-nums leading-none" aria-live="polite">
            {wait}
            <span className="ml-1 font-sans text-xl font-bold text-white/60">min</span>
          </p>
          <button
            type="button"
            aria-label="Five minutes more"
            disabled={wait >= 120 || done}
            onClick={() => {
              bump([8]);
              setWait((w) => Math.min(120, w + 5));
            }}
            className="press-btn grid h-14 w-14 place-items-center rounded-full border border-white/25 text-2xl font-bold"
          >
            +
          </button>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {WAIT_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              disabled={done}
              onClick={() => {
                bump([8]);
                setWait(m);
              }}
              className={`press-btn rounded-xl border py-3 text-base font-extrabold ${
                wait === m ? "border-amber bg-amber/20 text-amber" : "border-white/20 text-white/85"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {busy > 0 && (
          <p className="mt-3 text-center text-sm font-semibold text-amber">
            Pacing is on: the customer is told {wait + busy} min ({wait} + {busy}).
          </p>
        )}

        <button
          type="button"
          onClick={confirm}
          className={`press-btn press-btn--accept mt-7 w-full min-h-[76px] text-2xl ${done ? "kb-accepted" : ""}`}
        >
          {done ? (
            <>
              <span className="kb-pop">✓</span> Accepted
            </>
          ) : (
            <>Accept · {wait} min</>
          )}
        </button>
        <button type="button" onClick={onClose} disabled={done} className="mt-3 w-full py-3 text-sm font-bold text-white/55 hover:text-white">
          Not yet
        </button>
      </div>
    </Sheet>
  );
}
