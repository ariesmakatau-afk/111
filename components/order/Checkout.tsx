"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import OrderCode from "./OrderCode";
import { formatMoney } from "@/lib/menu";
import { describe, productById, unitPrice } from "@/lib/order";
import { pickupSlots } from "@/lib/hours";
import { site } from "@/lib/site";
import { igniteAt } from "@/lib/embers";
import { useCart } from "./CartProvider";
import Sheet from "./Sheet";
import ShopNotice from "./ShopNotice";
import { IconArrow, IconCheck, IconPhone } from "../Icons";

type Sent = { orderId: string | null; total: number; name: string; pickup: string };

const DETAILS_KEY = "yiannis:details";

/** Pickup checkout: details → send → confirmation with a live tracking link. */
export default function Checkout() {
  const { lines, total, checkoutOpen, setCheckoutOpen, clear, setLastOrderId } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState("ASAP");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [slots, setSlots] = useState<{ value: string; label: string }[]>([]);
  const [paused, setPaused] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);
  const sendRef = useRef<HTMLButtonElement>(null);

  // Fresh slots and ordering status each time checkout opens; remember the
  // customer's name and number on this device so regulars don't retype it.
  useEffect(() => {
    if (!checkoutOpen) return;
    const s = pickupSlots();
    setSlots(s);
    setPickup((cur) => (s.some((x) => x.value === cur) ? cur : s[0]?.value ?? ""));
    setError(null);
    try {
      const d = JSON.parse(localStorage.getItem(DETAILS_KEY) ?? "{}");
      if (d.name) setName((v) => v || d.name);
      if (d.phone) setPhone((v) => v || d.phone);
    } catch {}
    fetch("/api/ordering", { cache: "no-store" })
      .then((r) => r.json())
      .then((b) => setPaused(b.paused ? b.message : null))
      .catch(() => setPaused(null));
  }, [checkoutOpen]);

  function close() {
    setCheckoutOpen(false);
    if (sent) setSent(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          pickupTime: slots.find((s) => s.value === pickup)?.label ?? pickup,
          email,
          orderNotes: notes,
          website,
          lines: lines.map(({ productId, sizeId, meats, sauces, extras, variant, excludes, qty }) => ({
            productId,
            sizeId,
            meats,
            sauces,
            extras,
            variant,
            excludes,
            qty,
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.paused) setPaused(body.error);
        throw new Error(body.error ?? "Something went wrong. Please call us instead.");
      }
      try {
        localStorage.setItem(DETAILS_KEY, JSON.stringify({ name, phone }));
      } catch {}
      // The order is in: sparks off the button that sent it, then the receipt.
      igniteAt(sendRef.current ?? { x: innerWidth / 2, y: innerHeight / 2 }, 60, 1.25);
      await new Promise((r) => setTimeout(r, 1100));
      setSent({ orderId: body.orderId ?? null, total: body.total ?? total, name, pickup: slots.find((s) => s.value === pickup)?.label ?? pickup });
      if (body.orderId) setLastOrderId(body.orderId);
      clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please call us instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={checkoutOpen} onClose={close} label={sent ? "Order sent" : "Checkout"} wide>
      {sent ? (
        <div className="overflow-y-auto px-6 pb-8 pt-10 text-center sm:px-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full text-[#1d0700] shadow-[0_0_40px_rgba(255,110,30,.6)]" style={{ background: "var(--fire-btn)" }}>
            <IconCheck className="h-7 w-7" />
          </span>
          <h2 className="h-md mt-6 text-blue-navy">
            Order sent, <span className="fire-text">{sent.name.split(" ")[0]}</span>.
          </h2>
          {/* The Greek table blessing, drawn in — the shop's way of saying
              "it's handled" to every customer, in the language of the pass. */}
          <p className="kali-orexi mx-auto mt-5" aria-label="Kali orexi — enjoy your meal">
            <span className="kali-orexi__greek">Καλή όρεξη</span>
            <svg viewBox="0 0 240 14" className="kali-orexi__rule" aria-hidden="true" fill="none" stroke="var(--gold)" strokeWidth="1.6">
              <path d="M4 10c14-8 22-8 36 0s22 8 36 0 22-8 36 0 22 8 36 0 22-8 36 0 14 8 16 0" strokeLinecap="round" />
            </svg>
            <span className="kali-orexi__say">kali orexi · enjoy your meal</span>
          </p>
          <p className="lede mx-auto mt-4 max-w-md">
            It&rsquo;s with the kitchen now. Pickup: <b className="text-ink">{sent.pickup}</b>. Pay {formatMoney(sent.total)} at the
            counter when you collect.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3">
            {sent.orderId ? (
              <Link href={`/order/status/${sent.orderId}`} className="btn btn-fire" onClick={close}>
                Track your order <IconArrow />
              </Link>
            ) : null}
            <a href={site.phoneHref} className="btn btn-ghost">
              <IconPhone /> Running late? {site.phone}
            </a>
          </div>
          {sent.orderId && (
            <>
              <OrderCode id={sent.orderId} />
              <p className="mt-4 text-sm text-muted">
                The tracking page shows your wait time as soon as the kitchen accepts.
              </p>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 overflow-y-auto sm:grid-cols-[1fr_260px]">
            <div className="px-6 pb-6 pt-10 sm:px-8">
              <p className="eyebrow">Pickup · pay in store</p>
              <h2 className="h-md mt-3 text-blue-navy">Your details</h2>

              {paused && (
                <p role="alert" className="mt-5 rounded-2xl border border-ember/30 bg-[#fff1e8] px-4 py-3 text-sm font-semibold text-ember-deep">
                  {paused}
                </p>
              )}
              <ShopNotice />

              <div className="mt-6 grid gap-4">
                <label className="field">
                  <span>Name</span>
                  <input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
                </label>
                <label className="field">
                  <span>Mobile</span>
                  <input required type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={24} />
                </label>
                <label className="field">
                  <span>Pickup time</span>
                  <select required value={pickup} onChange={(e) => setPickup(e.target.value)}>
                    {slots.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>
                    Email <em>optional. Only for promos, never spam. We swear on yia-yia.</em>
                  </span>
                  <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
                </label>
                <label className="field">
                  <span>
                    Notes <em>optional</em>
                  </span>
                  <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={400} placeholder="Extra crispy, running 5 min late… (no onion is a tap in the builder now!)" />
                </label>
                {/* Honeypot — hidden from people, irresistible to bots. */}
                <label className="absolute -left-[9999px]" aria-hidden="true">
                  Website
                  <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </label>
              </div>
            </div>

            <aside className="border-t border-line bg-porcelain px-6 py-6 sm:border-l sm:border-t-0 sm:pt-10">
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-blue">Summary</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                {lines.map((l) => {
                  const p = productById(l.productId);
                  if (!p) return null;
                  const d = describe(p, l);
                  return (
                    <li key={l.key} className="flex justify-between gap-3">
                      <span>
                        <b>{l.qty}×</b> {d.title}
                        {d.detail && <span className="block text-xs text-muted">{d.detail}</span>}
                      </span>
                      <span className="tabular-nums">{formatMoney(unitPrice(p, l) * l.qty)}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-sm font-semibold text-muted">Total</span>
                <span className="font-serif text-3xl text-blue-navy tabular-nums">{formatMoney(total)}</span>
              </div>
            </aside>
          </div>

          <div className="border-t border-line bg-white px-6 py-4 sm:px-8">
            {error && (
              <p role="alert" className="mb-3 text-sm font-semibold text-ember-deep">
                {error}
              </p>
            )}
            <button ref={sendRef} type="submit" className="btn btn-fire w-full text-[1rem]" disabled={busy || !lines.length || Boolean(paused)}>
              {busy ? "Sending to the kitchen…" : `Send order · ${formatMoney(total)}`}
            </button>
            <p className="mt-2 text-center text-xs text-muted">No payment online. You pay at the counter when you collect.</p>
          </div>
        </form>
      )}
    </Sheet>
  );
}
