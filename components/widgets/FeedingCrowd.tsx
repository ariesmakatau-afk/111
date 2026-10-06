"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/menu";
import { cartTotal, describe, MAX_QTY, productById, unitPrice, type CartLine, type LineConfig } from "@/lib/order";
import { igniteAt } from "@/lib/embers";
import { useCart } from "../order/CartProvider";
import { IconArrow, IconCheck, IconFlame } from "../Icons";

/** One line of the plan: what it is, why this many. */
type PlanLine = { cfg: LineConfig; qty: number; when: string };

function planFor(people: number): PlanLine[] {
  const meatPacks = Math.ceil(people / 4); // a large Meat Pack is 3–4 people food
  const pitas = Math.max(1, people); // one pita a head; more at the counter if needed
  const familyChips = Math.max(1, Math.ceil(people / 4));
  const salad = Math.max(1, Math.ceil(people / 3));
  const sauce = Math.max(1, Math.ceil(people / 6));
  const lines: PlanLine[] = [
    { cfg: { productId: "meat-pack", sizeId: "large", meats: ["lamb", "chicken", "pork"], sauces: ["Garlic"], extras: [] }, qty: meatPacks, when: "the meat — a large Meat Pack feeds three or four" },
    { cfg: { productId: "pita-bread", sizeId: "standard", meats: [], sauces: [], extras: [] }, qty: pitas, when: "warm pita, one a head" },
    { cfg: { productId: "chips", sizeId: "family", meats: [], sauces: [], extras: [] }, qty: familyChips, when: "a family chip tray per four" },
    { cfg: { productId: "salad-pack", sizeId: "standard", meats: [], sauces: [], extras: [] }, qty: salad, when: "salad to cut through it" },
    { cfg: { productId: "garlic-sauce", sizeId: "m", meats: [], sauces: [], extras: [] }, qty: sauce, when: "garlic sauce — medium tub per six, more if it's family" },
  ];
  return lines;
}

/** Anything beyond a menu line's max quantity is a proper quote job, not a basket. */
export function planIsOrderable(plan: PlanLine[]): boolean {
  return plan.every((l) => l.qty <= MAX_QTY);
}

const line = (l: PlanLine): CartLine => ({ ...l.cfg, key: "", qty: l.qty });

/**
 * "Feeding a crowd?" — a headcount slider that assembles a real menu order,
 * priced by the same code the kitchen runs. Not a quote; a starting point.
 */
export default function FeedingCrowd() {
  const { add, customise } = useCart();
  const [people, setPeople] = useState(10);
  const [added, setAdded] = useState(false);

  const plan = useMemo(() => planFor(people), [people]);
  const total = useMemo(() => cartTotal(plan.map(line)), [plan]);
  const orderable = useMemo(() => planIsOrderable(plan), [plan]);

  return (
    <div className="feeding tile p-7 sm:p-9">
      <div className="grid gap-9 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div>
          <p className="eyebrow">Plan it</p>
          <h3 className="mt-4 font-serif text-[clamp(1.9rem,3.2vw,2.6rem)] leading-tight text-blue-navy">
            Slide to your headcount. <span className="fire-text">We&rsquo;ll do the Greek-mother maths.</span>
          </h3>
          <p className="lede mt-4 text-[0.98rem]">
            A rough, honest starting point built from the real menu — not a quote. We&rsquo;ll confirm numbers and prices when we
            call back.
          </p>

          <div className="mt-8">
            <div className="flex items-end justify-between">
              <label htmlFor="crowd" className="text-[0.72rem] font-extrabold uppercase tracking-[0.22em] text-blue">
                Heads around the table
              </label>
              <span className="font-serif text-[3.2rem] leading-none text-blue-navy tabular-nums">{people}</span>
            </div>
            <input
              id="crowd"
              type="range"
              min={4}
              max={60}
              step={2}
              value={people}
              onChange={(e) => {
                setPeople(Number(e.target.value));
                setAdded(false);
              }}
              className="feeding__range mt-4 w-full"
              aria-valuetext={`${people} people`}
            />
            <div className="mt-1 flex justify-between text-[0.72rem] font-bold text-muted">
              <span>4</span>
              <span>60+</span>
            </div>
          </div>
        </div>

        <div className="feeding__card" data-tone="dark">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.22em] text-amber">The plan, from the menu</p>
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-[0.7rem] font-bold text-white/70">{people} people</span>
          </div>
          <ul className="mt-4 divide-y divide-white/10">
            {plan.map((p) => {
              const product = productById(p.cfg.productId)!;
              const d = describe(product, p.cfg);
              return (
                <li key={p.cfg.productId} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="min-w-0">
                    <b className="block text-[0.95rem] text-white">
                      <span className="font-serif text-[1.2rem] font-normal text-amber">{p.qty}×</span> {d.title}
                      {d.detail && <span className="block text-[0.75rem] font-medium text-white/50">{d.detail}</span>}
                    </b>
                    <span className="text-[0.78rem] text-white/45">{p.when}</span>
                  </span>
                  <span className="shrink-0 font-serif text-[1.3rem] leading-none text-white/90 tabular-nums">
                    {formatMoney(unitPrice(product, p.cfg) * p.qty)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-5">
            <p>
              <span className="block text-[0.72rem] font-bold uppercase tracking-[0.16em] text-white/50">Rough total · pay at the counter</span>
              <span className="font-serif text-[2.6rem] leading-none text-white">{formatMoney(total)}</span>
            </p>
            {orderable ? (
              added ? (
                <span className="btn btn-glass btn-sm"><IconCheck /> In your basket</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-fire btn-sm"
                  onClick={(e) => {
                    igniteAt(e.currentTarget, 46, 1.2);
                    plan.forEach((p) => add(p.cfg, p.qty));
                    setAdded(true);
                    window.setTimeout(() => setAdded(false), 2600);
                  }}
                >
                  <IconFlame /> Put it on my order
                </button>
              )
            ) : (
              <a href="#enquire" className="btn btn-fire btn-sm">
                <IconFlame /> This is a quote job — ask us
              </a>
            )}
          </div>
          {!orderable && (
            <p className="mt-3 text-[0.8rem] leading-relaxed text-white/55">
              Past twenty-odd heads, trays get built by hand with a call back and a fixed price — that&rsquo;s the catering
              way. The plan above is exactly what to put in the form.
            </p>
          )}
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[0.8rem] text-white/55">
            <Link href="#enquire" className="inline-flex items-center gap-1.5 font-bold text-amber hover:text-white">
              Ask about trays <IconArrow className="h-3.5 w-3.5" />
            </Link>
            <button type="button" className="inline-flex items-center gap-1.5 font-bold text-white/75 underline decoration-white/25 underline-offset-4 hover:text-white" onClick={() => customise("meat-pack")}>
              Tweak the meat pack
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
