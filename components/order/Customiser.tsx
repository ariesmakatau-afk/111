"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  extraById,
  formatMoney,
  meats,
  sauces as SAUCE_LIST,
  type ExtraId,
  type MeatId,
  type Product,
} from "@/lib/menu";
import { freshConfig, MAX_QTY, unitPrice, type LineConfig } from "@/lib/order";
import { productPhotos } from "@/lib/menu-media";
import { igniteAt } from "@/lib/embers";
import { useCart } from "./CartProvider";
import Sheet from "./Sheet";
import { IconArrow, IconCheck, IconMinus, IconPlus } from "../Icons";

/**
 * The option sheet — rebuilt as a stepper. One decision per screen, a big
 * obvious selected state, and the order flows in the same steps the kitchen
 * runs: size, meat, what comes OFF the salad, sauces, then extras as the
 * last polite question ("most people skip — that's normal"). Priced by
 * lib/order, which the server re-checks anyway, so nothing here is trust-based.
 */

type StepId = "size" | "meat" | "variant" | "salad" | "sauces" | "extras";
type Step = { id: StepId; label: string; hint: string };

function stepsFor(product: Product): Step[] {
  const s: Step[] = [];
  if (product.sizes.length > 1) s.push({ id: "size", label: "What size?", hint: "One tap. We move on for you." });
  if (product.meatChoice) s.push({ id: "meat", label: "Which meat?", hint: "One, two or all three — lamb adds $2, once." });
  if (product.variant) s.push({ id: "variant", label: `${product.variant.label}?`, hint: "" });
  if (product.salad?.length)
    s.push({ id: "salad", label: "Everything's in.", hint: "Tap off anything you don't want." });
  if (product.freeSauces !== undefined)
    s.push({ id: "sauces", label: `Pick your sauces.`, hint: `${product.freeSauces} free, then 50c each. Garlic's on already.` });
  if (product.allowedExtras.length > 0)
    s.push({ id: "extras", label: "Anything extra?", hint: "Most people say no — there's no shame in a pure yiros." });
  return s;
}

export default function Customiser() {
  const { customising: product, closeCustomiser, add } = useCart();
  const [cfg, setCfg] = useState<LineConfig | null>(null);
  const [qty, setQty] = useState(1);
  const [step, setStep] = useState(0);
  const [added, setAdded] = useState(false);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    if (product) {
      setCfg(freshConfig(product));
      setQty(1);
      setStep(0);
      setAdded(false);
    }
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, [product]);

  if (!product || !cfg) return null;

  const steps = stepsFor(product);
  const total = steps.length;
  const at = steps[Math.min(step, total - 1)];
  const lastStep = step >= total - 1;
  const size = product.sizes.find((s) => s.id === cfg.sizeId) ?? product.sizes[0];
  const unit = unitPrice(product, cfg);
  const needsMeat = product.meatChoice && cfg.meats.length === 0;
  const photo = productPhotos[product.id];
  const extrasCost = cfg.extras.reduce((sum, id) => sum + (extraById.get(id)?.price ?? 0), 0);
  const excludes = cfg.excludes ?? [];

  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const next = () => setStep((s) => Math.min(total - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const advanceSoon = () => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => setStep((s) => Math.min(total - 1, s + 1)), 240);
  };

  function submit(e: React.MouseEvent<HTMLButtonElement>) {
    if (needsMeat || !cfg || added) return;
    igniteAt(e.currentTarget, 46, 1.1);
    add(cfg, qty);
    setAdded(true);
    window.setTimeout(closeCustomiser, 650);
  }

  return (
    <Sheet open onClose={closeCustomiser} label={`Choose options for ${product.name}`}>
      {photo ? (
        <div className="relative h-36 shrink-0 sm:h-44">
          <Image src={photo.src} alt={photo.alt} fill sizes="600px" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/25 to-transparent" />
        </div>
      ) : (
        <div className="h-10 shrink-0" />
      )}

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-2 sm:px-8" style={{ marginTop: photo ? "-3.5rem" : 0 }}>
        {/* Where you are — dots + count, no jargon */}
        {total > 1 && (
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="step-dots">
              {steps.map((s, i) => (
                <i key={s.id} className={i < step ? "is-done" : i === step ? "is-now" : ""} />
              ))}
            </span>
            <span className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-muted">
              {step + 1} / {total}
            </span>
          </div>
        )}

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4" key={at?.id}>
          <h2 className="font-serif text-[2rem] leading-tight text-blue-navy sm:text-[2.3rem]">{at?.label}</h2>
          {at?.hint && <p className="mt-2 max-w-md text-[0.95rem] leading-snug text-muted">{at?.hint}</p>}

          {at?.id === "size" && (
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Size">
              {product.sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={cfg.sizeId === s.id}
                  className={`step-card ${cfg.sizeId === s.id ? "is-on" : ""}`}
                  onClick={() => {
                    setCfg({ ...cfg, sizeId: s.id });
                    advanceSoon();
                  }}
                >
                  <span className="step-card__name">{s.name}</span>
                  <span className="step-card__price">{formatMoney(s.price)}</span>
                  {cfg.sizeId === s.id && <IconCheck className="step-card__tick" />}
                </button>
              ))}
            </div>
          )}

          {at?.id === "meat" && (
            <div className="mt-6 grid gap-2.5" role="group" aria-label="Meat">
              {meats.map((m) => {
                const on = cfg.meats.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={on}
                    className={`step-card ${on ? "is-on" : ""}`}
                    onClick={() => setCfg({ ...cfg, meats: toggle<MeatId>(cfg.meats, m.id) })}
                  >
                    <span className="step-card__name">
                      {m.name}
                      {m.note && <span className="step-card__halal">{m.note}</span>}
                    </span>
                    {m.id === "lamb" && <span className="step-card__price">+{formatMoney(size.lambSurcharge ?? 2)}</span>}
                    {on && <IconCheck className="step-card__tick" />}
                  </button>
                );
              })}
              {needsMeat && (
                <p className="text-sm font-bold text-ember-deep" role="status">
                  Pick at least one — the fire&rsquo;s waiting.
                </p>
              )}
            </div>
          )}

          {at?.id === "variant" && product.variant && (
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label={product.variant.label}>
              {product.variant.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={cfg.variant === o}
                  className={`step-card ${cfg.variant === o ? "is-on" : ""}`}
                  onClick={() => {
                    setCfg({ ...cfg, variant: o });
                    advanceSoon();
                  }}
                >
                  <span className="step-card__name">{o}</span>
                  {cfg.variant === o && <IconCheck className="step-card__tick" />}
                </button>
              ))}
            </div>
          )}

          {at?.id === "salad" && product.salad && (
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {product.salad.map((veg) => {
                const off = excludes.includes(veg);
                return (
                  <button
                    key={veg}
                    type="button"
                    aria-pressed={!off}
                    className={`step-card ${off ? "is-off" : "is-on"}`}
                    onClick={() =>
                      setCfg({ ...cfg, excludes: off ? excludes.filter((x) => x !== veg) : [...excludes, veg] })
                    }
                  >
                    <span className="step-card__name">
                      <span className={off ? "step-card__strike" : ""}>{veg}</span>
                      {off && <span className="step-card__offnote">skipped</span>}
                    </span>
                    <span className="step-card__price !text-[0.72rem] !font-extrabold uppercase tracking-[0.14em]">
                      {off ? "Tap to add back" : "In"}
                    </span>
                  </button>
                );
              })}
              {excludes.length > 0 && (
                <p className="text-sm font-bold text-blue-deep" role="status">
                  Kitchen sees: <span className="text-ember-deep">no {excludes.map((x) => x.toLowerCase()).join(", ")}</span>
                </p>
              )}
            </div>
          )}

          {at?.id === "sauces" && (
            <div className="mt-6 flex flex-wrap gap-2.5" role="group" aria-label="Sauces">
              {SAUCE_LIST.map((s) => {
                const on = cfg.sauces.includes(s);
                const paid = on ? cfg.sauces.indexOf(s) >= (product.freeSauces ?? 0) : false;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    className={`chip !min-h-[48px] !px-5 !text-[0.98rem] ${on ? "chip--on" : ""}`}
                    onClick={() => setCfg({ ...cfg, sauces: toggle<string>(cfg.sauces, s) })}
                  >
                    {on && <IconCheck className="h-4 w-4" />}
                    {s}
                    {paid && <span className="chip__extra">+50c</span>}
                  </button>
                );
              })}
              <p className="w-full text-sm font-semibold text-muted">
                {(() => {
                  const over = Math.max(0, cfg.sauces.length - (product.freeSauces ?? 0)) * 0.5;
                  if (!cfg.sauces.length) return "None picked — plain it is.";
                  if (over > 0) return `${cfg.sauces.length} picked · +${formatMoney(over)} over the free ones`;
                  return `${cfg.sauces.length} picked · all free`;
                })()}
              </p>
            </div>
          )}

          {at?.id === "extras" && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2.5">
                {product.allowedExtras.map((id) => {
                  const x = extraById.get(id)!;
                  const on = cfg.extras.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={on}
                      className={`chip !min-h-[48px] !px-5 !text-[0.98rem] ${on ? "chip--on" : ""}`}
                      onClick={() => setCfg({ ...cfg, extras: toggle<ExtraId>(cfg.extras, id) })}
                    >
                      {on && <IconCheck className="h-4 w-4" />}
                      {x.name} <span className="chip__extra">+{formatMoney(x.price)}</span>
                    </button>
                  );
                })}
              </div>
              {cfg.extras.includes("extra-meat") && product.meatChoice && (
                <p className="mt-4 text-sm text-muted">Extra meat doubles what&rsquo;s carved — whatever meats you picked.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* The bar that never moves, so a thumb always knows where Next is. */}
      <div className="mt-auto flex items-center gap-3 border-t border-line bg-white/95 px-6 py-4 backdrop-blur sm:px-8">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="btn btn-ghost btn-sm !px-4 disabled:invisible"
        >
          <IconArrow className="h-4 w-4 rotate-180" /> Back
        </button>

        {lastStep ? (
          <>
            <div className="ml-auto flex items-center gap-1 rounded-full border border-line bg-porcelain p-1">
              <button
                type="button"
                aria-label="One fewer"
                className="grid h-10 w-10 place-items-center rounded-full text-blue-deep hover:bg-white disabled:opacity-40"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
              >
                <IconMinus />
              </button>
              <span className="w-7 text-center font-serif text-2xl tabular-nums" aria-live="polite" aria-label="Quantity">
                {qty}
              </span>
              <button
                type="button"
                aria-label="One more"
                className="grid h-10 w-10 place-items-center rounded-full text-blue-deep hover:bg-white"
                onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
              >
                <IconPlus />
              </button>
            </div>
            <button type="button" className="btn btn-fire flex-1 !min-h-[54px]" onClick={submit} disabled={needsMeat}>
              {added ? (
                <>
                  <IconCheck /> Added
                </>
              ) : (
                <>
                  Add · <span className="tabular-nums">{formatMoney(unit * qty)}</span>
                </>
              )}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={next}
            className="btn btn-blue ml-auto min-w-[150px] flex-1 !min-h-[54px]"
          >
            {at?.id === "extras" && extrasCost === 0
              ? "No thanks — just that"
              : at?.id === "extras"
                ? `With extras · +${formatMoney(extrasCost)}`
                : "Next"}
            <IconArrow className="h-4 w-4" />
          </button>
        )}
      </div>
    </Sheet>
  );
}
