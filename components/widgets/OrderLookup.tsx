"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconArrow } from "../Icons";

/**
 * "Where's my yiros?" — paste the code from the confirmation page and hop
 * straight to the live tracker. The tracker itself is the existing
 * /order/status/[id] page; this is just the front door for people who
 * closed the link in a hurry.
 */
export default function OrderLookup() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = code.trim().toLowerCase().replace(/\s+/g, "");
    if (!id) {
      setError("The code's on your confirmation page — looks like 4k9x-2f…");
      return;
    }
    if (!/^[0-9a-f][0-9a-f-]{18,44}$/.test(id)) {
      setError("That doesn't look like an order code. Paste the whole thing from the confirmation page.");
      return;
    }
    setError(null);
    router.push(`/order/status/${id}`);
  };

  return (
    <form onSubmit={submit} className="order-lookup" noValidate>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <label htmlFor="order-code" className="block text-[0.72rem] font-extrabold uppercase tracking-[0.22em] text-amber">
            Where&rsquo;s my yiros?
          </label>
          <input
            id="order-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste your order code"
            autoComplete="off"
            spellCheck={false}
            className={`mt-2 w-full rounded-xl border bg-white/[0.06] px-4 py-3 font-mono text-[0.95rem] text-white placeholder:text-white/35 focus:border-amber focus:outline-none ${
              error ? "border-ember" : "border-white/15"
            }`}
          />
        </div>
        <button type="submit" className="btn btn-fire btn-sm self-stretch sm:self-auto">
          Track it <IconArrow />
        </button>
      </div>
      <p className={`mt-2 min-h-[1.2em] text-[0.8rem] ${error ? "text-amber" : "text-white/45"}`} aria-live="polite">
        {error ?? "Your code is on the confirmation page after checkout."}
      </p>
    </form>
  );
}
