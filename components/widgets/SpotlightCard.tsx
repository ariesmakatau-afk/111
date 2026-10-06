"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/menu";
import { cartTotal, describe, productById, unitPrice, type CartLine } from "@/lib/order";
import { momentOf, type Moment } from "@/lib/shop-live";
import { igniteAt } from "@/lib/embers";
import { useShopNow } from "./useShopNow";
import { useCart } from "../order/CartProvider";
import { IconArrow, IconCheck, IconClock, IconPlus } from "../Icons";

const priceOf = (m: Moment) =>
  cartTotal(m.lines.map((l) => ({ ...l.cfg, key: "", qty: l.qty }) as CartLine));

/**
 * The big time-of-day spotlight on the Today panel. Copy and the suggested
 * order change with the hour; the menu does the pricing.
 */
export default function SpotlightCard() {
  const now = useShopNow(5_000);
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  // The shell is server-rendered (so scroll-reveal finds it); the body
  // wakes up on the client once the Adelaide clock resolves.
  if (!now) {
    return (
      <article className="spotlight tile !border-transparent" data-reveal="scale" aria-busy="true">
        <div className="spotlight__skeleton">
          <span /><span /><span />
        </div>
      </article>
    );
  }

  const moment = momentOf(now);
  const price = priceOf(moment);
  const items = moment.lines.map((l) => {
    const p = productById(l.cfg.productId)!;
    return { ...describe(p, l.cfg), qty: l.qty, line: formatMoney(unitPrice(p, l.cfg) * l.qty) };
  });

  return (
    <article className="spotlight tile !border-transparent" data-reveal="scale">
      <div className="spotlight__head">
        <span className="flex items-center gap-2 text-[0.72rem] font-extrabold uppercase tracking-[0.2em] text-ember-deep">
          <IconClock className="h-3.5 w-3.5" /> {moment.kicker}
        </span>
        <span className="rounded-full bg-mist px-3 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-blue">
          Right now
        </span>
      </div>

      <h3 className="mt-5 font-serif text-[clamp(2rem,3.4vw,2.9rem)] leading-[1.02] text-blue-navy">{moment.title}</h3>
      <p className="mt-4 leading-relaxed text-muted">{moment.body}</p>

      <ul className="mt-6 divide-y divide-line rounded-[18px] border border-line bg-porcelain/70 px-5 py-1.5">
        {items.map((it) => (
          <li key={it.title + it.detail} className="flex items-baseline justify-between gap-4 py-3">
            <span className="text-[0.95rem] font-semibold text-ink">
              {it.qty > 1 && <b className="mr-1.5 font-serif text-[1.15rem] font-normal text-ember-deep">{it.qty}×</b>}
              {it.title}
              {it.detail && <span className="block text-[0.8rem] font-medium text-muted">{it.detail}</span>}
            </span>
            <span className="font-serif text-[1.35rem] leading-none text-blue-deep">{it.line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">
          <b className="font-serif text-[1.9rem] font-normal text-blue-deep">{formatMoney(price)}</b>
          <span className="ml-2">the lot · pay at the counter</span>
        </p>
        {added ? (
          <span className="btn btn-blue !bg-[#e8f2e5] !text-[#1e5b2a] !border-[#bcd9b4]">
            <IconCheck /> On the spit
          </span>
        ) : (
          <button
            type="button"
            className="btn btn-fire"
            onClick={(e) => {
              igniteAt(e.currentTarget, 44, 1.15);
              moment.lines.forEach((l) => add(l.cfg, l.qty));
              setAdded(true);
              window.setTimeout(() => setAdded(false), 2400);
            }}
          >
            <IconPlus /> {moment.cta}
          </button>
        )}
      </div>

      <p className="mt-5 text-center text-[0.82rem] text-muted">
        {now.open && now.lastSlotMin === null ? (
          <>It&rsquo;s after the last timed slot — online still has <b>&ldquo;as soon as possible&rdquo;</b> while the fire is up.</>
        ) : (
          <>
            Rather build your own?{" "}
            <Link href="/menu" className="font-bold text-blue hover:text-ember-deep">
              Start here <IconArrow className="inline h-3.5 w-3.5" />
            </Link>
          </>
        )}
      </p>
    </article>
  );
}
