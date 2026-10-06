"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/menu";
import { describe, productById, unitPrice } from "@/lib/order";
import { site } from "@/lib/site";
import { useCart } from "./CartProvider";
import CoalBed from "../fire/CoalBed";
import EmberCanvas from "../fire/EmberCanvas";
import { IconArrow, IconClose, IconMinus, IconPhone, IconPlus } from "../Icons";

/** The charcoal order docket: lines, total, checkout. */
export default function OrderTicket({ embers = true, inSheet = false }: { embers?: boolean; inSheet?: boolean }) {
  const { lines, count, total, setQty, remove, clear, setCheckoutOpen, setSheetOpen, lastOrderId } = useCart();

  return (
    <div className="ticket surface-dark grain shadow-[0_40px_80px_-40px_rgba(11,20,40,.8)]" data-tone="dark">
      <div className="relative z-10 p-6 sm:p-7">
        <div className={`flex items-center justify-between ${inSheet ? "pr-12" : ""}`}>
          <p className="eyebrow">Your order</p>
          <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs font-bold text-white/70">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>

        {lines.length === 0 ? (
          <div className="py-9 text-center">
            <p className="font-serif text-[2rem] leading-tight text-white">
              Nothing on the <span className="fire-text">spit</span> yet.
            </p>
            <p className="mx-auto mt-3 max-w-[16rem] text-sm text-white/55">
              Tap <b className="text-white">Add</b> on anything. Start with a yiros — everyone does.
            </p>
          </div>
        ) : (
          <ul className="mt-4 max-h-[42vh] divide-y divide-white/10 overflow-y-auto pr-1">
            {lines.map((l) => {
              const p = productById(l.productId);
              if (!p) return null;
              const d = describe(p, l);
              return (
                <li key={l.key} className="flex gap-3 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug text-white">{d.title}</p>
                    {d.detail && <p className="mt-0.5 text-[0.8rem] leading-snug text-white/55">{d.detail}</p>}
                    <div className="mt-2 flex items-center gap-1.5">
                      <button type="button" aria-label={`One fewer ${p.name}`} className="qty-dark" onClick={() => setQty(l.key, l.qty - 1)}>
                        <IconMinus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">{l.qty}</span>
                      <button type="button" aria-label={`One more ${p.name}`} className="qty-dark" onClick={() => setQty(l.key, l.qty + 1)}>
                        <IconPlus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${p.name}`}
                        className="ml-1 grid h-7 w-7 place-items-center rounded-full text-white/40 hover:text-amber"
                        onClick={() => remove(l.key)}
                      >
                        <IconClose className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="font-serif text-xl tabular-nums text-gold">{formatMoney(unitPrice(p, l) * l.qty)}</p>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex items-end justify-between border-t border-white/15 pt-4">
          <span className="text-sm font-semibold text-white/60">Total · pay in store</span>
          <span className="fire-text !not-italic font-serif text-[2.6rem] leading-none tabular-nums">{formatMoney(total)}</span>
        </div>

        <div className="mt-5 grid gap-2.5">
          <button
            type="button"
            className="btn btn-fire w-full"
            disabled={!lines.length}
            onClick={() => {
              setSheetOpen(false);
              setCheckoutOpen(true);
            }}
          >
            Checkout for pickup <IconArrow />
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <a href={site.phoneHref} className="btn btn-glass btn-sm">
              <IconPhone /> Call instead
            </a>
            <a href={site.uberEats} target="_blank" rel="noopener" className="btn btn-glass btn-sm">
              Delivery
            </a>
          </div>
          {lines.length > 0 && (
            <button type="button" className="mt-1 text-xs font-semibold text-white/40 hover:text-white/70" onClick={clear}>
              Clear order
            </button>
          )}
          {lastOrderId && (
            <Link href={`/order/status/${lastOrderId}`} className="mt-1 text-center text-xs font-bold text-amber hover:underline">
              Track your last order →
            </Link>
          )}
        </div>
      </div>
      <div className="relative h-16 overflow-hidden">
        <CoalBed className="!h-16" />
        {embers && <EmberCanvas tone="dark" rate={14} band={0.3} motes={0} scale={0.8} />}
      </div>
    </div>
  );
}
