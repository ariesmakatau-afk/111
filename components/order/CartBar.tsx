"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/menu";
import { useCart } from "./CartProvider";
import OrderTicket from "./OrderTicket";
import Sheet from "./Sheet";
import { IconBag } from "../Icons";

/** Phones: a floating "view order" bar, opening the docket as a sheet. */
export default function CartBar() {
  const { count, total, pulse, sheetOpen, setSheetOpen } = useCart();
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (!pulse) return;
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 500);
    return () => window.clearTimeout(t);
  }, [pulse]);

  return (
    <>
      <div className={`fixed inset-x-3 bottom-3 z-50 transition-transform duration-500 lg:hidden ${count ? "translate-y-0" : "translate-y-[150%]"}`}>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={`btn btn-fire w-full justify-between !px-5 text-[1rem] ${bump ? "cart-bump" : ""}`}
          aria-haspopup="dialog"
        >
          <span className="flex items-center gap-2">
            <IconBag className="h-5 w-5" /> View order
            <span className="rounded-full bg-[#1d0700] px-2 py-0.5 text-xs text-gold">{count}</span>
          </span>
          <span className="font-serif text-xl tabular-nums">{formatMoney(total)}</span>
        </button>
      </div>
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} label="Your order" tone="dark">
        <div className="overflow-y-auto">
          <OrderTicket embers={false} inSheet />
        </div>
      </Sheet>
    </>
  );
}
