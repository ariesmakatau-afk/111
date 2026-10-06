"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/menu";
import { site } from "@/lib/site";
import { IconPhone } from "../Icons";
import OrderPushToggle from "../push/OrderPushToggle";
import OrderCode from "./OrderCode";

type Item = { name: string; detail?: string; quantity: number; unitPrice?: number; notes?: string };
type Order = {
  customer_name: string;
  pickup_time: string;
  status: "new" | "accepted" | "rejected" | "collected";
  wait_minutes: number | null;
  created_at: string;
  items?: Item[];
  total?: number | null;
};

const POLL_MS = 15000;
const STEPS = ["Received", "On the spit", "Collected"];

export default function OrderTracker({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(0);
  const lastStatus = useRef<string | null>(null);

  // The kitchen's pacing buffer, so the wait the customer sees is the wait
  // the kitchen is actually running. Polls the same public flags endpoint
  // the checkout uses — one line of truth.
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/ordering", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((b) => alive && b && setBusy(Number(b.busyMinutes) || 0))
        .catch(() => {});
    load();
    const t = window.setInterval(load, 60000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  const STATUS_WORDS: Record<string, string> = {
    new: "received",
    accepted: "on the spit",
    collected: "picked up",
    rejected: "couldn't be taken",
  };
  // In-tab alert the moment the status moves while this page is open. Same
  // tag as the server push, so a device that gets both sees one notification,
  // not two.
  useEffect(() => {
    if (!order) return;
    const prev = lastStatus.current;
    lastStatus.current = order.status;
    if (prev && prev !== order.status && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification(
          order.status === "accepted"
            ? "🔥 Your yiros is on the spit"
            : order.status === "collected"
              ? "✅ Picked up — kali orexi"
              : order.status === "rejected"
                ? "The shop couldn't take this order"
                : "Order update",
          { body: `Status: ${STATUS_WORDS[order.status] ?? order.status}. ${order.pickup_time}`, tag: `yiannis-${id}` }
        );
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status]);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/order/status?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not check that order.");
      setOrder(body.order);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check that order.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(t);
  }, [load]);

  if (loading) return <p className="py-24 text-center text-white/60">Checking the spit…</p>;

  if (error || !order) {
    return (
      <div className="char-card w-full max-w-lg p-8 text-center">
        <p className="font-serif text-3xl text-white">We couldn&rsquo;t find that order</p>
        <p className="mt-3 text-white/60">
          Check the link, or call us on{" "}
          <a href={site.phoneHref} className="font-bold text-amber">
            {site.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  const step = order.status === "new" ? 0 : order.status === "accepted" ? 1 : order.status === "collected" ? 2 : -1;
  const rejected = order.status === "rejected";
  const headline =
    order.status === "new"
      ? "Order received"
      : order.status === "accepted"
        ? order.wait_minutes != null
          ? `About ${order.wait_minutes + busy} minutes`
          : "On the spit now"
        : order.status === "collected"
          ? "Picked up — enjoy"
          : "We couldn't take this one";
  const detail =
    order.status === "new"
      ? "Give the kitchen a moment to confirm — your wait time appears here the second they do."
      : order.status === "accepted"
        ? "The kitchen's on it. Head over when you're ready; it'll be waiting."
        : order.status === "collected"
          ? "Καλή όρεξη — thanks for coming in. See you next time."
          : "Something came up and the shop couldn't take this order. Give us a ring and we'll sort it out.";
  const busyAside = busy > 0 && (order.status === "new" || order.status === "accepted") ? ` (+${busy} min — the kitchen is pacing itself tonight)` : "";

  return (
    <div className="w-full max-w-xl">
      <p className="eyebrow justify-center">Order for {order.customer_name}</p>
      <h1 className="h-xl mt-5 text-center text-white">
        {rejected ? headline : <span className={order.status === "accepted" ? "fire-text !not-italic" : ""}>{headline}</span>}
      </h1>
      <p className="lede mx-auto mt-4 max-w-md text-center">
        {detail}
        {busyAside && <span className="mt-1 block text-[0.85rem] font-semibold text-amber">{busyAside}</span>}
      </p>
      <OrderCode id={id} tone="dark" />

      {!rejected && (
        <ol className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-2" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className="text-center">
              <span
                className={`mx-auto block h-1.5 rounded-full transition-all duration-700 ${
                  i <= step ? "shadow-[0_0_14px_rgba(255,120,30,.8)]" : "bg-white/10"
                }`}
                style={i <= step ? { background: "var(--fire)" } : undefined}
              />
              <span className={`mt-2 block text-xs font-bold uppercase tracking-[0.14em] ${i <= step ? "text-amber" : "text-white/35"}`}>
                {s}
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="char-card mt-10 p-6 sm:p-7">
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-white/50">Pickup</span>
          <span className="font-bold text-white">{order.pickup_time}</span>
        </div>
        {order.items && order.items.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
            {order.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-4 text-white/80">
                <span>
                  <b className="text-white">{it.quantity}×</b> {it.name}
                  {(it.detail || it.notes) && <span className="block text-xs text-white/45">{it.detail ?? it.notes}</span>}
                </span>
                {it.unitPrice != null && <span className="tabular-nums">{formatMoney(it.unitPrice * it.quantity)}</span>}
              </li>
            ))}
          </ul>
        )}
        {order.total != null && (
          <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
            <span className="text-sm text-white/50">Pay at the counter</span>
            <span className="font-serif text-3xl text-gold tabular-nums">{formatMoney(Number(order.total))}</span>
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <OrderPushToggle orderRef={id} />
        <a href={site.phoneHref} className="btn btn-glass">
          <IconPhone /> {site.phone}
        </a>
        <Link href="/menu" className="btn btn-glass">
          Back to the menu
        </Link>
      </div>
      <p className="mt-5 text-center text-xs text-white/40">This page updates on its own — leave it open.</p>
    </div>
  );
}
