"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconArrow } from "@/components/Icons";

type Deal = { banner: string; details: string };

/**
 * The deal from /admin, fetched in the browser rather than baked into the
 * cached page, so a change or switch-off shows on the next page load.
 */
function useDeal() {
  const [deal, setDeal] = useState<Deal | null>(null);
  useEffect(() => {
    fetch("/api/deal", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => setDeal(b?.on ? { banner: b.banner, details: b.details ?? "" } : null))
      .catch(() => {});
  }, []);
  return deal;
}

/** One-line banner at the top of the home page. */
export function DealBanner() {
  const deal = useDeal();
  if (!deal) return null;
  return (
    <Link
      href="/menu#deal"
      className="fade-up mb-5 flex w-fit max-w-full items-center gap-3 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm font-bold text-blue-navy shadow-lg transition hover:bg-mist"
    >
      <span className="shrink-0 rounded-full bg-blue px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-white">Deal</span>
      <span className="min-w-0">{deal.banner}</span>
      <IconArrow />
    </Link>
  );
}

/** The full deal at the top of /menu. */
export function DealCard() {
  const deal = useDeal();
  useEffect(() => {
    // It loads after the page, so jump to it when arriving from the banner.
    if (deal && window.location.hash === "#deal") document.getElementById("deal")?.scrollIntoView();
  }, [deal]);
  if (!deal) return null;
  return (
    <section id="deal" className="surface-blue scroll-mt-40 rounded-[26px] p-7" data-tone="dark">
      <p className="eyebrow !text-white/85">On now</p>
      <h2 className="mt-2 font-serif text-[2rem] leading-tight text-white">{deal.banner}</h2>
      {deal.details && <p className="mt-3 max-w-xl whitespace-pre-line text-white/80">{deal.details}</p>}
    </section>
  );
}
