"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/menu";
import { cartTotal, lineKey, type LineConfig } from "@/lib/order";
import { igniteAt } from "@/lib/embers";
import { useCart } from "./CartProvider";
import GreekKey from "../GreekKey";
import { IconCheck, IconPlus } from "../Icons";

export type Usual = { name: string; items: string[]; note: string; lines: { cfg: LineConfig; qty: number }[] };

/** A ready-made order: one tap puts every line in the cart. */
export default function UsualCard({ usual, featured = false }: { usual: Usual; featured?: boolean }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const price = cartTotal(usual.lines.map((l) => ({ ...l.cfg, key: lineKey(l.cfg), qty: l.qty })));

  return (
    <article className={`tile flex h-full flex-col p-7 ${featured ? "md:-translate-y-4 md:hover:-translate-y-6" : ""}`}>
      <GreekKey tone={featured ? "ember" : "blue"} className="!h-2.5 opacity-80" />
      <h3 className="mt-6 font-serif text-[2.2rem] leading-none text-blue-navy">{usual.name}</h3>
      <ul className="mt-5 flex-1 space-y-2 text-[0.95rem] text-ink">
        {usual.items.map((it) => (
          <li key={it} className="flex items-start gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ember shadow-[0_0_8px_rgba(255,100,30,.8)]" />
            {it}
          </li>
        ))}
      </ul>
      <div className="mt-7 flex items-end justify-between border-t border-line pt-5">
        <p className="max-w-[11rem] text-[0.82rem] leading-snug text-muted">{usual.note}</p>
        <p className="font-serif text-[2.6rem] leading-none text-blue">{formatMoney(price)}</p>
      </div>
      {added ? (
        <Link href="/menu" className="btn btn-blue mt-5 w-full">
          <IconCheck /> Added — view order
        </Link>
      ) : (
        <button
          type="button"
          className="btn btn-fire mt-5 w-full"
          onClick={(e) => {
            igniteAt(e.currentTarget, 40);
            usual.lines.forEach((l) => add(l.cfg, l.qty));
            setAdded(true);
          }}
        >
          <IconPlus /> Add all to order
        </button>
      )}
    </article>
  );
}
