"use client";

import { useState } from "react";

/** The order's tracking code, shown to the customer with a one-tap copy. */
export default function OrderCode({ id, tone = "light" }: { id: string; tone?: "light" | "dark" }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  }
  const dark = tone === "dark";
  return (
    <div className={`mx-auto mt-5 max-w-sm rounded-2xl border px-4 py-3 text-left ${dark ? "border-white/15 bg-white/[0.05]" : "border-line bg-mist/60"}`}>
      <p className={`text-[0.68rem] font-extrabold uppercase tracking-[0.2em] ${dark ? "text-amber" : "text-blue"}`}>Your order code</p>
      <div className="mt-1.5 flex items-center gap-3">
        <code className={`min-w-0 flex-1 break-all font-mono text-[0.8rem] leading-snug ${dark ? "text-white/85" : "text-ink"}`}>{id}</code>
        <button
          type="button"
          onClick={copy}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${dark ? "border-white/25 text-white" : "border-line-strong text-blue-deep"}`}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className={`mt-1.5 text-xs ${dark ? "text-white/50" : "text-muted"}`}>Use it in “Track your order” on the home page.</p>
    </div>
  );
}
