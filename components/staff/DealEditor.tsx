"use client";

import { useState } from "react";
import type { Deal } from "@/lib/content-store";

/** Turn the deal on or off and edit its banner line and full details. */
export default function DealEditor({ initial, disabled }: { initial: Deal; disabled: boolean }) {
  const [on, setOn] = useState(initial.on);
  const [banner, setBanner] = useState(initial.banner);
  const [details, setDetails] = useState(initial.details);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(nextOn: boolean) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/deal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: nextOn, banner, details }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save.");
      setOn(body.on);
      setBanner(body.banner);
      setDetails(body.details);
      setMsg(body.on ? "Saved — the deal is live." : "Saved — the deal is off the site.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={saving || disabled}
          onClick={() => save(!on)}
          className={`relative h-9 w-16 rounded-full transition ${on ? "bg-green-600" : "bg-muted/40"} disabled:opacity-50`}
        >
          <span className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${on ? "left-8" : "left-1"}`} />
          <span className="sr-only">Show the deal</span>
        </button>
        <b className={on ? "text-green-700" : "text-muted"}>{on ? "Deal is live" : "No deal showing"}</b>
      </div>
      <label className="field mt-5">
        <span>Banner line (home page)</span>
        <input value={banner} onChange={(e) => setBanner(e.target.value)} maxLength={120} placeholder="Tuesday: two yiros + two drinks for $40" />
      </label>
      <label className="field mt-3">
        <span>
          Full deal (Menu page) <em>optional</em>
        </span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={600}
          rows={4}
          placeholder="Every Tuesday, 11am till close. Any two regular yiros and two cans. Mention the deal at the counter."
        />
      </label>
      <button type="button" className="btn btn-ghost btn-sm mt-3" disabled={saving || disabled} onClick={() => save(on)}>
        {saving ? "Saving…" : "Save deal"}
      </button>
      {msg && <p className="mt-2 text-sm font-semibold text-blue-deep">{msg}</p>}
    </div>
  );
}
