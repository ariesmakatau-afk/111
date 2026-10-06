"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/menu";
import { useCart } from "./CartProvider";
import { IconArrow, IconClose, IconFlame } from "../Icons";

/**
 * Global "just added" toast — bottom centre on phones (above the cart bar),
 * bottom-right elsewhere. Reads from the cart provider, so every add path
 * (builder, wheel, usuals, customiser) gets the same little celebration.
 */
export default function CartToast() {
  const { lastAdded, dismissToast, setSheetOpen } = useCart();
  const [visible, setVisible] = useState(false);

  const seq = lastAdded?.seq;
  useEffect(() => {
    if (!seq) return;
    setVisible(true);
    const hide = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(dismissToast, 350);
    }, 3400);
    return () => window.clearTimeout(hide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq]);

  if (!lastAdded) return null;

  return (
    <div className={`cart-toast ${visible ? "is-in" : ""}`} role="status" aria-live="polite" data-tone="dark">
      <span className="cart-toast__flame" aria-hidden="true">
        <IconFlame className="h-5 w-5 text-[#3d1102]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-amber">Onto the spit</p>
        <p className="mt-0.5 truncate text-[0.95rem] font-bold text-white">
          {lastAdded.title}
          <span className="ml-2 font-serif text-[1.15rem] font-normal text-gold">{formatMoney(lastAdded.price)}</span>
        </p>
        {lastAdded.detail && <p className="mt-0.5 truncate text-[0.78rem] text-white/55">{lastAdded.detail}</p>}
      </div>
      <button
        type="button"
        className="btn btn-fire btn-sm shrink-0 !min-h-[38px]"
        onClick={() => {
          dismissToast();
          setSheetOpen(true);
        }}
      >
        View order <IconArrow className="h-3.5 w-3.5" />
      </button>
      <button type="button" aria-label="Dismiss" className="cart-toast__close" onClick={dismissToast}>
        <IconClose className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
