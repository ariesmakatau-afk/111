"use client";

import Link from "next/link";
import { useState } from "react";
import { extraById, formatMoney, meats, sauces as allSauces, type ExtraId, type MeatId } from "@/lib/menu";
import { productById, unitPrice, describe, type LineConfig } from "@/lib/order";
import { igniteAt } from "@/lib/embers";
import { useCart } from "./CartProvider";
import { IconCheck, IconFlame, IconMinus, IconPlus } from "../Icons";

const yiros = productById("yiros")!;
const ALLOWED = yiros.allowedExtras;
const EXTRAS = ALLOWED.map((id) => extraById.get(id)!).filter(Boolean);
const SALAD = yiros.salad ?? [];
const FREE = yiros.freeSauces ?? 2;

const meatSwatch: Record<MeatId, string> = {
  lamb: "linear-gradient(180deg,#a2452b,#7c2d16)",
  chicken: "linear-gradient(180deg,#e2a95f,#bd7c33)",
  pork: "linear-gradient(180deg,#d98a92,#b05560)",
};

const sauceSwatch: Record<string, string> = {
  Garlic: "#f2e7cf",
  BBQ: "#5a2d18",
  "Sweet chilli": "#d8622a",
  "Hot chilli": "#b3271a",
  "Peri peri": "#e07a2a",
  "Nando's peri-peri": "#cf6127",
  Aioli: "#efe3c0",
  Mayonnaise: "#f6efe0",
  Mustard: "#d8a72a",
  Tomato: "#c03a2a",
  Tabasco: "#7e1c12",
};

/** The house order — also the reset button. Salad defaults to everything IN. */
const HOUSE: LineConfig = {
  productId: "yiros",
  sizeId: "regular",
  meats: ["lamb", "chicken"],
  sauces: ["Garlic"],
  extras: [],
  excludes: [],
};

/**
 * "Build your yiros, right here" — the full option set from the real menu
 * data, priced by the same functions the kitchen trust-checks, in the same
 * order the order sheet asks: size, meat, salad off-switches, sauces, and
 * extras last as a question. The wrap is painted live from the choices:
 * CSS, not a mood board — exclude the tomato and the tomato goes.
 */
export default function YirosBuilder() {
  const { add, customise } = useCart();
  const [cfg, setCfg] = useState<LineConfig>(HOUSE);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const price = unitPrice(yiros, cfg);
  const excludes = cfg.excludes ?? [];
  const noMeat = cfg.meats.length === 0;
  const overSauces = cfg.sauces.length > FREE;
  const extrasCost = cfg.extras.reduce((sum, id) => sum + (extraById.get(id)?.price ?? 0), 0);

  const toggleMeat = (id: MeatId) =>
    setCfg((c) => ({ ...c, meats: c.meats.includes(id) ? c.meats.filter((m) => m !== id) : [...c.meats, id] }));
  const toggleExtra = (id: ExtraId) =>
    setCfg((c) => ({ ...c, extras: c.extras.includes(id) ? c.extras.filter((x) => x !== id) : [...c.extras, id] }));
  const toggleSauce = (s: string) =>
    setCfg((c) => ({ ...c, sauces: c.sauces.includes(s) ? c.sauces.filter((x) => x !== s) : [...c.sauces, s] }));
  const toggleVeg = (veg: string) =>
    setCfg((c) => {
      const off = c.excludes ?? [];
      return { ...c, excludes: off.includes(veg) ? off.filter((x) => x !== veg) : [...off, veg] };
    });

  const d = describe(yiros, cfg);
  const hasLettuce = !excludes.includes("Lettuce");
  const hasTomato = !excludes.includes("Tomato");
  const hasOnion = !excludes.includes("Onion");

  return (
    <div className="builder grid overflow-hidden lg:grid-cols-[0.9fr_1.1fr]">
      {/* ---------------- The stage: a wrap painted from the choices ---------------- */}
      <div className="builder__stage" data-tone="dark" aria-hidden="true">
        <div className="builder__steam" />
        <div className="builder__wrap">
          <div className={`wrap-layer wrap-layer__top ${cfg.extras.includes("cheese") ? "is-cheese" : ""}`}>
            <span className="wrap-layer__toast" />
          </div>
          {cfg.sauces.length > 0 && (
            <div className="wrap-layer wrap-layer__sauces">
              {cfg.sauces.map((s) => (
                <span key={s} className="sauce-dot" style={{ background: sauceSwatch[s] ?? "#f2e7cf" }} title={s} />
              ))}
            </div>
          )}
          {cfg.extras.includes("extra-meat") && (
            <div className="wrap-layer wrap-layer__meat is-double" style={{ background: meatSwatch[cfg.meats[0] ?? "lamb"] }} />
          )}
          {cfg.meats.map((m) => (
            <div key={m} className="wrap-layer wrap-layer__meat" style={{ background: meatSwatch[m] }} />
          ))}
          {cfg.extras.includes("cooked-onion") && <div className="wrap-layer wrap-layer__onion" />}
          {(hasLettuce || hasTomato || hasOnion) && (
            <div className="wrap-layer wrap-layer__salad">
              {hasLettuce && <span className="salad-lettuce" />}
              {hasTomato && (
                <>
                  <span className="salad-tomato" style={{ left: "22%" }} />
                  <span className="salad-tomato" style={{ left: "64%", top: "-1px" }} />
                </>
              )}
              {hasOnion && <span className="salad-onion" />}
            </div>
          )}
          {cfg.extras.includes("chips") && <div className="wrap-layer wrap-layer__chips" />}
          {cfg.extras.includes("falafel") && (
            <div className="wrap-layer wrap-layer__falafel">
              <i /><i /><i />
            </div>
          )}
          <div className="wrap-layer wrap-layer__base" />
        </div>
        <p className="builder__readout">
          <IconFlame className="h-3.5 w-3.5 text-amber" />
          {noMeat ? "Pick at least one meat — the fire's waiting." : d.title}
          {d.detail && <span className="builder__detail">{d.detail}</span>}
        </p>
      </div>

      {/* ---------------- The controls: same questions, same order, as the sheet ---------------- */}
      <div className="builder__controls p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ember-deep">1 · Size</p>
            <p className="mt-1 text-sm text-muted">Regular is the house answer. Mini if you&rsquo;ve already eaten.</p>
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label="Size">
            {yiros.sizes.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={cfg.sizeId === s.id} className={`chip ${cfg.sizeId === s.id ? "chip--on" : ""}`} onClick={() => setCfg({ ...cfg, sizeId: s.id })}>
                {s.name} <span className="font-semibold opacity-70">{formatMoney(s.price)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ember-deep">2 · Meat</p>
            <p className="mt-1 text-sm text-muted">One, two or all three. Lamb adds $2, charged once however you mix.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Meat">
            {meats.map((m) => (
              <button key={m.id} type="button" aria-pressed={cfg.meats.includes(m.id)} className={`chip ${cfg.meats.includes(m.id) ? "chip--on" : ""}`} onClick={() => toggleMeat(m.id)}>
                <span className="meat-dot" style={{ background: meatSwatch[m.id] }} aria-hidden="true" />
                {m.name}
                {m.note && <span className="chip__halal">{m.note}</span>}
                {m.id === "lamb" && <span className="chip__extra">+$2</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ember-deep">3 · Salad — tap off what you don&rsquo;t want</p>
              <p className="mt-1 text-sm text-muted">It comes with all of it. Nothing comes off unless you say so.</p>
            </div>
            {excludes.length > 0 && (
              <span className="text-[0.78rem] font-bold text-ember-deep" role="status">
                NO {excludes.map((x) => x.toLowerCase()).join(", ")}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Salad">
            {SALAD.map((veg) => {
              const off = excludes.includes(veg);
              return (
                <button key={veg} type="button" aria-pressed={!off} className={`chip !min-h-[42px] ${off ? "chip--off" : "chip--on"}`} onClick={() => toggleVeg(veg)}>
                  {off ? <span className="chip__not">no</span> : <IconCheck className="h-3.5 w-3.5" />}
                  <span className={off ? "line-through decoration-2 decoration-ember/80" : ""}>{veg}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ember-deep">4 · Sauces</p>
              <p className="mt-1 text-sm text-muted">
                {FREE} free, then 50c each. Garlic&rsquo;s already in. We&rsquo;re Greek, it&rsquo;s the law.
              </p>
            </div>
            <span className={`text-[0.78rem] font-bold ${overSauces ? "text-ember-deep" : "text-muted"}`}>
              {cfg.sauces.length}/{FREE} free{overSauces && ` · +${formatMoney((cfg.sauces.length - FREE) * 0.5)}`}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Sauces">
            {allSauces.map((s) => (
              <button key={s} type="button" aria-pressed={cfg.sauces.includes(s)} className={`chip !min-h-[38px] !px-3.5 !text-[0.82rem] ${cfg.sauces.includes(s) ? "chip--on" : ""}`} onClick={() => toggleSauce(s)}>
                <span className="sauce-dot" style={{ background: sauceSwatch[s] }} aria-hidden="true" />
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-ember-deep">5 · Anything extra?</p>
            <p className="mt-1 text-sm text-muted">
              {extrasCost === 0 ? "Optional. Most people skip it." : `That’s +${formatMoney(extrasCost)}. The onion one is the good one.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Extras">
            {EXTRAS.map((x) => (
              <button key={x.id} type="button" aria-pressed={cfg.extras.includes(x.id)} className={`chip ${cfg.extras.includes(x.id) ? "chip--on" : ""}`} onClick={() => toggleExtra(x.id)}>
                {x.name} <span className="chip__extra">+{formatMoney(x.price)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-line bg-white shadow-sm">
              <button type="button" aria-label="One fewer" className="p-2.5 text-blue hover:text-ember" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <IconMinus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center font-extrabold tabular-nums">{qty}</span>
              <button type="button" aria-label="One more" className="p-2.5 text-blue hover:text-ember" onClick={() => setQty((q) => Math.min(20, q + 1))}>
                <IconPlus className="h-4 w-4" />
              </button>
            </span>
            <button type="button" className="text-[0.78rem] font-bold text-muted underline decoration-dotted underline-offset-4 hover:text-blue" onClick={() => { setCfg(HOUSE); setQty(1); }}>
              Reset to the house way
            </button>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-right leading-none">
              <span className="block text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-muted">Per piece</span>
              <span className="font-serif text-[2.6rem] text-blue-deep tabular-nums">{formatMoney(price)}</span>
            </p>
            {added ? (
              <span className="btn btn-blue !bg-[#e8f2e5] !text-[#1e5b2a] !border-[#bcd9b4]"><IconCheck /> On the spit</span>
            ) : (
              <button
                type="button"
                className="btn btn-fire"
                disabled={noMeat}
                onClick={(e) => {
                  igniteAt(e.currentTarget, 50, 1.2);
                  add(cfg, qty);
                  setAdded(true);
                  window.setTimeout(() => setAdded(false), 2200);
                }}
              >
                <IconFlame /> Add · {formatMoney(price * qty)}
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-[0.82rem] text-muted">
          Prefer one question at a time?{" "}
          <button type="button" className="font-bold text-blue underline underline-offset-4 hover:text-ember-deep" onClick={() => customise("yiros")}>
            Open the guided builder
          </button>{" "}
          · or{" "}
          <Link href="/menu" className="font-bold text-blue underline underline-offset-4 hover:text-ember-deep">
            the whole menu
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
