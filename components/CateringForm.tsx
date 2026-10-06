"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { igniteAt } from "@/lib/embers";
import { IconCheck, IconPhone } from "./Icons";

export default function CateringForm() {
  const [f, setF] = useState({ name: "", phone: "", email: "", eventDate: "", headcount: "", fulfilment: "Pickup from the shop", notes: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const btn = e.currentTarget.querySelector("button[type=submit]");
    try {
      const res = await fetch("/api/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, headcount: Number(f.headcount) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't send that — please call us.");
      if (btn) igniteAt(btn, 50, 1.2);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send that — please call us.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="tile p-8 text-center hover:!translate-y-0">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full text-[#1d0700]" style={{ background: "var(--fire-btn)" }}>
          <IconCheck className="h-6 w-6" />
        </span>
        <h3 className="h-md mt-5 text-blue-navy">Got it, {f.name.split(" ")[0]}.</h3>
        <p className="lede mx-auto mt-3 max-w-sm">We&rsquo;ll call you back to talk numbers and timing. In a hurry? Ring the shop.</p>
        <a href={site.phoneHref} className="btn btn-ghost mt-6">
          <IconPhone /> {site.phone}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="tile grid gap-4 p-6 hover:!translate-y-0 sm:grid-cols-2 sm:p-8">
      <label className="field">
        <span>Your name</span>
        <input required value={f.name} onChange={set("name")} autoComplete="name" maxLength={60} />
      </label>
      <label className="field">
        <span>Mobile</span>
        <input required type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" maxLength={24} />
      </label>
      <label className="field">
        <span>
          Email <em>optional</em>
        </span>
        <input type="email" value={f.email} onChange={set("email")} autoComplete="email" maxLength={120} />
      </label>
      <label className="field">
        <span>Date of the event</span>
        <input required type="date" value={f.eventDate} onChange={set("eventDate")} />
      </label>
      <label className="field">
        <span>How many people?</span>
        <input required type="number" min={1} max={5000} inputMode="numeric" value={f.headcount} onChange={set("headcount")} />
      </label>
      <label className="field">
        <span>Pickup or delivery?</span>
        <select value={f.fulfilment} onChange={set("fulfilment")}>
          <option>Pickup from the shop</option>
          <option>Delivery — let&rsquo;s talk</option>
          <option>Not sure yet</option>
        </select>
      </label>
      <label className="field sm:col-span-2">
        <span>
          Anything we should know? <em>optional</em>
        </span>
        <textarea rows={3} value={f.notes} onChange={set("notes")} maxLength={800} placeholder="Office lunch at 12:30, a few vegetarians, lots of garlic sauce…" />
      </label>
      <label className="absolute -left-[9999px]" aria-hidden="true">
        Website
        <input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} />
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold text-ember-deep sm:col-span-2">
          {error}
        </p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" className="btn btn-fire w-full" disabled={busy}>
          {busy ? "Sending…" : "Send catering enquiry"}
        </button>
        <p className="mt-2 text-center text-xs text-muted">No commitment — we&rsquo;ll call you back to sort out the details.</p>
      </div>
    </form>
  );
}
