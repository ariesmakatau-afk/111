"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/menu";
import { playConfirm } from "@/lib/alertSounds";
import Sheet from "../../order/Sheet";
import { bump, type Item, type Order, type Patch } from "./types";

type View = "menu" | "time" | "amounts" | "soldout" | "reject";

export const SOLDOUT_QUICK = ["Lamb", "Chicken", "Pork", "Falafel", "Chips"];

/**
 * Everything you might do to an order besides accepting or finishing it,
 * behind one ⋯ button, so the ticket itself stays clean.
 */
export default function OrderOptionsSheet({
  order,
  paused,
  onClose,
  onPatch,
  onSoldOut,
  onTogglePause,
}: {
  order: Order | null;
  paused: boolean | null;
  onClose: () => void;
  onPatch: Patch;
  onSoldOut: (note: string) => void;
  onTogglePause: () => void;
}) {
  const [view, setView] = useState<View>("menu");
  const [lines, setLines] = useState<Item[]>([]);
  const [soldOut, setSoldOut] = useState("");

  useEffect(() => {
    if (order) {
      setView("menu");
      setLines(order.items);
      setSoldOut("");
    }
  }, [order]);

  if (!order) return null;
  const isNew = order.status === "new";
  const total = lines.reduce((s, i) => s + (i.unitPrice ?? 0) * i.quantity, 0);

  function done(fn: () => void) {
    playConfirm();
    bump();
    fn();
    onClose();
  }

  const rows: { view?: View; label: string; sub: string; danger?: boolean; action?: () => void; hide?: boolean }[] = [
    { view: "time", label: "More time", sub: `Told ${order.wait_minutes ?? 0} min — push it back`, hide: isNew },
    { view: "amounts", label: "Change amounts", sub: "Customer changed their mind at the counter" },
    { view: "soldout", label: "Something's sold out", sub: "Tell the menu and checkout straight away" },
    {
      label: paused ? "Turn online orders back on" : "Pause online orders",
      sub: paused ? "Customers can order online again" : "Customers are asked to call instead",
      action: () => done(onTogglePause),
      hide: paused === null,
    },
    { view: "reject", label: isNew ? "Reject order" : "Cancel order", sub: "Call the customer first", danger: true },
  ];

  return (
    <Sheet open onClose={onClose} label={`Options for ${order.customer_name}'s order`} tone="light">
      <div className="overflow-y-auto p-6 pt-7 sm:p-8">
        {view !== "menu" && (
          <button type="button" onClick={() => setView("menu")} className="mb-3 text-sm font-bold text-[#3a3a3a]">
            ← Back
          </button>
        )}
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#3a3a3a]">Order options</p>
        <h2 className="mt-2 pr-12 font-serif text-4xl leading-none">{order.customer_name}</h2>

        {view === "menu" && (
          <ul className="mt-6 space-y-2.5">
            {rows
              .filter((r) => !r.hide)
              .map((r) => (
                <li key={r.label}>
                  <button
                    type="button"
                    onClick={() => (r.action ? r.action() : r.view && setView(r.view))}
                    className={`press-btn flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left ${
                      r.danger ? "border-[#e7b2ab] bg-[#fde8e6]" : "border-[#e4e4e4] bg-[#fafafa]"
                    }`}
                  >
                    <span>
                      <span className={`block text-lg font-extrabold ${r.danger ? "text-[#8a1c13]" : "text-[#111]"}`}>{r.label}</span>
                      <span className="block text-sm text-[#3a3a3a]">{r.sub}</span>
                    </span>
                    <span aria-hidden="true" className="text-xl text-[#3a3a3a]">
                      →
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        )}

        {view === "time" && (
          <div className="mt-6">
            <p className="text-sm text-[#3a3a3a]">
              Currently told <b className="text-[#111]">{order.wait_minutes ?? 0} min</b>. Add:
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {[5, 10, 15].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => done(() => onPatch(order.id, { waitMinutes: Math.min(240, (order.wait_minutes ?? 0) + m) }))}
                  className="press-btn press-btn--light min-h-[64px] text-xl"
                >
                  +{m} min
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs font-semibold text-[#3a3a3a]">The customer&rsquo;s tracker updates straight away.</p>
          </div>
        )}

        {view === "amounts" && (
          <div className="mt-6">
            <ul className="space-y-3">
              {lines.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{item.name}</span>
                    {item.detail && <span className="block truncate text-xs font-semibold text-[#3a3a3a]">{item.detail}</span>}
                  </span>
                  <button
                    type="button"
                    aria-label={`One less ${item.name}`}
                    disabled={item.quantity <= 1}
                    onClick={() => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, quantity: l.quantity - 1 } : l)))}
                    className="press-btn grid h-12 w-12 place-items-center rounded-full border border-[#d0d0d0] text-xl"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-lg font-extrabold tabular-nums">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`One more ${item.name}`}
                    onClick={() => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, quantity: Math.min(99, l.quantity + 1) } : l)))}
                    className="press-btn grid h-12 w-12 place-items-center rounded-full border border-[#d0d0d0] text-xl"
                  >
                    +
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex justify-between border-t border-[#ececec] pt-3 text-sm font-semibold text-[#3a3a3a]">
              <span>New total</span>
              <b className="font-serif text-xl font-normal text-[#111] tabular-nums">{formatMoney(total)}</b>
            </p>
            <button type="button" onClick={() => done(() => onPatch(order.id, { items: lines }))} className="press-btn press-btn--accept mt-5 w-full min-h-[60px] text-lg">
              Save amounts
            </button>
          </div>
        )}

        {view === "soldout" && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-[#3a3a3a]">What&rsquo;s run out? It shows on the menu and at checkout until you clear it in Settings.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SOLDOUT_QUICK.map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => setSoldOut(`${x} is sold out tonight.`)}
                  className={`press-btn rounded-full border px-4 py-2.5 text-sm font-extrabold ${
                    soldOut.startsWith(x) ? "border-black bg-black text-white" : "border-[#d0d0d0] text-[#111]"
                  }`}
                >
                  {x}
                </button>
              ))}
            </div>
            <input
              value={soldOut}
              onChange={(e) => setSoldOut(e.target.value.slice(0, 140))}
              placeholder="Or type it, e.g. Out of pita for 10 minutes."
              className="mt-3 w-full rounded-xl border border-[#d0d0d0] bg-white px-4 py-3 text-[#111] placeholder:text-[#5c5c5c] focus:border-black focus:outline-none"
            />
            <button
              type="button"
              disabled={!soldOut.trim()}
              onClick={() => done(() => onSoldOut(soldOut.trim()))}
              className="press-btn press-btn--accept mt-4 w-full min-h-[60px] text-lg"
            >
              Post it
            </button>
            <p className="mt-3 text-xs font-semibold text-[#3a3a3a]">
              If this order has it, call {order.customer_name} on{" "}
              <a href={`tel:${order.phone}`} className="font-bold text-[#0b3278]">
                {order.phone}
              </a>
              .
            </p>
          </div>
        )}

        {view === "reject" && (
          <div className="mt-6">
            <p className="text-base font-semibold text-[#222]">Call {order.customer_name} before you {isNew ? "reject" : "cancel"} it, so nobody turns up to nothing.</p>
            <a href={`tel:${order.phone}`} className="press-btn press-btn--light mt-4 flex w-full min-h-[60px] text-lg">
              Call {order.phone}
            </a>
            <button
              type="button"
              onClick={() => {
                bump([30, 40, 30]);
                onPatch(order.id, { status: "rejected" });
                onClose();
              }}
              className="press-btn press-btn--reject mt-3 w-full min-h-[60px] text-lg"
            >
              {isNew ? "Reject order" : "Cancel order"}
            </button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
