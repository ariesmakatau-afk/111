"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/menu";
import { cartTotal, type CartLine, type LineConfig } from "@/lib/order";
import { igniteAt } from "@/lib/embers";
import { useCart } from "../order/CartProvider";
import { IconCheck, IconFlame } from "../Icons";

type Order = { label: string; title: string; lines: { cfg: LineConfig; qty: number }[] };

/** Six real orders, priced by the menu. The wheel just picks. */
const ORDERS: Order[] = [
  {
    label: "Classic Chicken",
    title: "Chicken Yiros, garlic, the works",
    lines: [{ cfg: { productId: "yiros", sizeId: "regular", meats: ["chicken"], sauces: ["Garlic"], extras: [] }, qty: 1 }],
  },
  {
    label: "Lamb & Garlic",
    title: "Lamb Yiros, double garlic attitude",
    lines: [{ cfg: { productId: "yiros", sizeId: "regular", meats: ["lamb"], sauces: ["Garlic"], extras: [] }, qty: 1 }],
  },
  {
    label: "The Full Mix",
    title: "All three meats on one yiros",
    lines: [{ cfg: { productId: "yiros", sizeId: "regular", meats: ["lamb", "chicken", "pork"], sauces: ["Garlic", "BBQ"], extras: [] }, qty: 1 }],
  },
  {
    label: "AB Territory",
    title: "Small AB Pack — chips down the bottom",
    lines: [{ cfg: { productId: "ab-pack", sizeId: "small", meats: ["lamb", "pork"], sauces: ["Garlic", "BBQ", "Hot chilli"], extras: [] }, qty: 1 }],
  },
  {
    label: "Pork & Chips",
    title: "Pork Yiros plus small chips",
    lines: [
      { cfg: { productId: "yiros", sizeId: "regular", meats: ["pork"], sauces: ["Garlic"], extras: [] }, qty: 1 },
      { cfg: { productId: "chips", sizeId: "small", meats: [], sauces: [], extras: [] }, qty: 1 },
    ],
  },
  {
    label: "The Vegie Turn",
    title: "Falafel Yiros and a Greek coffee",
    lines: [
      { cfg: { productId: "falafel-yiros", sizeId: "standard", meats: [], sauces: ["Garlic"], extras: [] }, qty: 1 },
      { cfg: { productId: "greek-coffee", sizeId: "standard", meats: [], sauces: [], extras: [] }, qty: 1 },
    ],
  },
];

const SEG = 360 / ORDERS.length;
const priceOf = (o: Order) => cartTotal(o.lines.map((l) => ({ ...l.cfg, key: "", qty: l.qty }) as CartLine));

const CONIC = ORDERS.map((_, i) => {
  const fill = i === 3 ? "#c8330a" : i % 2 ? "#0b3278" : "#1450b4";
  return `${fill} ${i * SEG}deg ${(i + 1) * SEG}deg`;
}).join(", ");

/**
 * Can't decide? The wheel decides. Six house orders — no gimmick prizes,
 * because the only wrong yiros is the one you didn't eat.
 */
export default function SpinForIt() {
  const { add, setSheetOpen } = useCart();
  const [rot, setRot] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  // Bumps once per landing so the needle bounce animation restarts (a
  // remount via key is the cheap, hydration-safe way to re-trigger CSS).
  const [landed, setLanded] = useState(0);

  const spin = () => {
    if (spinning) return;
    const idx = Math.floor(Math.random() * ORDERS.length);
    setResult(null);
    setAdded(false);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desired = ((-(idx * SEG + SEG / 2) % 360) + 360) % 360;
    const delta = (desired - (((rot % 360) + 360) % 360) + 360) % 360;
    if (reduce) {
      setRot(rot + delta);
      setResult(idx);
      return;
    }
    setSpinning(true);
    // Extra full turns only. Adding extra *segments* used to land one wedge
    // past the prize the copy announced.
    setRot(rot + 360 * 5 + delta);
    window.setTimeout(() => {
      setSpinning(false);
      setResult(idx);
      setLanded((n) => n + 1);
      // Sparks from the hub, a two-beat buzz if the phone can buzz — the
      // wheel should feel like a machine, not a <div>.
      const el = document.getElementById("wheel-disc");
      if (el) {
        const r = el.getBoundingClientRect();
        igniteAt({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, 34, 1.15);
      }
      try {
        navigator.vibrate?.([0, 30, 70, 24]);
      } catch {}
    }, 4100);
  };

  const won = result !== null ? ORDERS[result] : null;

  return (
    <div className="wheel-card" data-tone="dark">
      <p className="eyebrow !text-amber !tracking-[0.18em]">Indecision, solved</p>

      <div className="wheel">
        <div key={landed} className={`wheel__needle${landed && !spinning ? " is-tick" : ""}`} aria-hidden="true" />
        <div
          id="wheel-disc"
          className="wheel__disc"
          style={{
            background: `conic-gradient(${CONIC})`,
            transform: `rotate(${rot}deg)`,
            transition: spinning ? "transform 4.1s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
          }}
        >
          {ORDERS.map((o, i) => (
            <span key={o.label} className="wheel__label" style={{ transform: `rotate(${i * SEG + SEG / 2}deg) translateY(-98px) translateX(-50%)` }}>
              <b>{o.label}</b>
              <em className="wheel__price">{formatMoney(priceOf(o))}</em>
            </span>
          ))}
          <span className="wheel__hub" aria-hidden="true">
            <IconFlame className="h-6 w-6 text-[#3d1102]" />
          </span>
        </div>
      </div>

      <div className="mt-6 min-h-[104px]">
        {won ? (
          <div className="wheel__result" role="status">
            <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.18em] text-amber">The wheel says</p>
            <p className="mt-1.5 font-serif text-[1.65rem] leading-tight text-white">
              {won.title} <span className="text-gold">{formatMoney(priceOf(won))}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {added ? (
                <>
                  <span className="btn btn-sm !bg-[#0f3b1c] !text-[#9fe0ae] !border border-[#2c6a40]">
                    <IconCheck /> Locked in
                  </span>
                  <button type="button" className="btn btn-glass btn-sm" onClick={() => setSheetOpen(true)}>
                    Open my order →
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-fire btn-sm"
                  onClick={(e) => {
                    igniteAt(e.currentTarget, 36, 1.1);
                    won.lines.forEach((l) => add(l.cfg, l.qty));
                    setAdded(true);
                  }}
                >
                  <IconFlame /> Add it to my order
                </button>
              )}
              <button type="button" className="btn btn-glass btn-sm" onClick={() => { setResult(null); setAdded(false); spin(); }}>
                Spin again
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-glass w-full" onClick={spin} disabled={spinning}>
            {spinning ? "Spinning…" : "Give it a spin"}
            {!spinning && <span aria-hidden="true">🎡</span>}
          </button>
        )}
      </div>

    </div>
  );
}
