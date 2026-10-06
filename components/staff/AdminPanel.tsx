"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/menu";
import StaffShell from "./StaffShell";
import SignedInDevices from "./SignedInDevices";
import PhotoWall from "./PhotoWall";
import DealEditor from "./DealEditor";
import type { Deal } from "@/lib/content-store";

type Photo = { id: string; url: string; caption: string; name?: string };

export type Enquiry = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string | null;
  event_date: string;
  headcount: number;
  fulfilment: string | null;
  notes: string | null;
  handled_at: string | null;
};

export type TodayStats = {
  orders: number;
  waiting: number;
  cooking: number;
  collected: number;
  rejected: number;
  value: number;
};

type Setup = { database: boolean; staffLogin: boolean; adminLogin: boolean; phoneAlerts: boolean; weeklyEmail: boolean; lockScreenPush: boolean };

const SECTIONS = [
  { id: "today", label: "Today" },
  { id: "ordering", label: "Online ordering" },
  { id: "deal", label: "Deal" },
  { id: "staff", label: "Staff photos" },
  { id: "customers", label: "Customer wall" },
  { id: "catering", label: "Catering" },
  { id: "devices", label: "Signed-in devices" },
  { id: "setup", label: "Setup" },
];

export default function AdminPanel({
  team,
  customers,
  ordering,
  deal,
  enquiries: initialEnquiries,
  stats,
  setup,
  maxSessions,
}: {
  team: Photo[];
  customers: Photo[];
  ordering: { paused: boolean; message: string };
  deal: Deal;
  enquiries: Enquiry[];
  stats: TodayStats | null;
  setup: Setup;
  maxSessions: number;
}) {
  const [paused, setPaused] = useState(ordering.paused);
  const [message, setMessage] = useState(ordering.message);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState(initialEnquiries);

  async function saveOrdering(next: { paused?: boolean; message?: string }) {
    setSaving(true);
    setSaved(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save.");
      setPaused(body.paused);
      setMessage(body.message);
      setSaved("Saved — the site updates within 30 seconds.");
    } catch (err) {
      setSaved(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function markHandled(id: string, handled: boolean) {
    setEnquiries((list) => list.map((e) => (e.id === id ? { ...e, handled_at: handled ? new Date().toISOString() : null } : e)));
    await fetch("/api/admin/enquiries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, handled }),
    }).catch(() => {});
  }

  const open = enquiries.filter((e) => !e.handled_at);

  return (
    <StaffShell>
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Admin sections" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded-full px-3.5 py-1.5 text-sm font-bold text-muted hover:bg-mist hover:text-blue-deep lg:rounded-xl">
                  {s.label}
                  {s.id === "catering" && open.length > 0 && (
                    <span className="ml-2 rounded-full bg-ember px-1.5 py-0.5 text-[0.65rem] text-white">{open.length}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-8">
          {/* Today */}
          <section id="today" className="scroll-mt-24">
            <h1 className="h-md text-blue-navy">Today at Yianni&rsquo;s</h1>
            {stats ? (
              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Orders", stats.orders],
                  ["Waiting", stats.waiting],
                  ["On the spit", stats.cooking],
                  ["Collected", stats.collected],
                  ["Rejected", stats.rejected],
                  ["Order value", formatMoney(Math.round(stats.value * 100) / 100)],
                ].map(([k, v]) => (
                  <div key={k as string} className="tile p-4 hover:!translate-y-0">
                    <dt className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-blue">{k}</dt>
                    <dd className="mt-1 font-serif text-4xl leading-none text-blue-navy tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted">Connect the database (see Setup) to see today&rsquo;s numbers.</p>
            )}
            <Link href="/kitchen" className="btn btn-blue btn-sm mt-5">
              Open the kitchen board →
            </Link>
          </section>

          {/* Ordering switch */}
          <section id="ordering" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">Online ordering</h2>
            <p className="mt-1 text-sm text-muted">Slammed on a Friday? Pause it. Customers see your message and the phone number instead.</p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <button
                type="button"
                role="switch"
                aria-checked={!paused}
                disabled={saving || !setup.database}
                onClick={() => saveOrdering({ paused: !paused })}
                className={`relative h-9 w-16 rounded-full transition ${paused ? "bg-muted/40" : "bg-green-600"} disabled:opacity-50`}
              >
                <span className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${paused ? "left-1" : "left-8"}`} />
                <span className="sr-only">Online ordering</span>
              </button>
              <b className={paused ? "text-ember-deep" : "text-green-700"}>{paused ? "Paused" : "Taking orders"}</b>
            </div>
            <label className="field mt-5">
              <span>Message shown while paused</span>
              <input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={200} />
            </label>
            <button type="button" className="btn btn-ghost btn-sm mt-3" disabled={saving || !setup.database} onClick={() => saveOrdering({ message })}>
              Save message
            </button>
            {saved && <p className="mt-2 text-sm font-semibold text-blue-deep">{saved}</p>}
          </section>

          {/* Deal */}
          <section id="deal" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">Deal</h2>
            <p className="mt-1 text-sm text-muted">
              The banner line shows at the top of the home page. Tapping it takes people to the full deal at the top of the Menu page.
            </p>
            <DealEditor initial={deal} disabled={!setup.database} />
          </section>

          {/* Staff */}
          <section id="staff" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">Staff photos</h2>
            <p className="mb-5 mt-1 text-sm text-muted">
              Shown on the Parea page and the home page as &ldquo;The team&rdquo;. Ask before posting anyone — and take it down if they leave.
            </p>
            <PhotoWall kind="team" initial={team} limit={4} />
          </section>

          {/* Customers */}
          <section id="customers" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">Customer wall</h2>
            <p className="mb-5 mt-1 text-sm text-muted">
              Regulars, first-timers, big nights. Shown on the Parea page and the home page. Always get a spoken yes before posting a face.
            </p>
            <PhotoWall kind="customers" initial={customers} limit={4} />
          </section>

          {/* Catering */}
          <section id="catering" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">Catering enquiries</h2>
            <p className="mt-1 text-sm text-muted">From the form on the Catering page. Each one also pings the shop phone.</p>
            {enquiries.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">No enquiries yet.</p>
            ) : (
              <ul className="mt-5 grid gap-3">
                {enquiries.map((e) => (
                  <li key={e.id} className={`rounded-2xl border p-4 ${e.handled_at ? "border-line bg-porcelain opacity-70" : "border-ember/40 bg-white"}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-bold text-blue-navy">
                        {e.name} · {e.headcount} people · {e.event_date}
                      </p>
                      <span className="text-xs text-muted">
                        {new Date(e.created_at).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Adelaide" })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">
                      <a href={`tel:${e.phone}`} className="font-bold text-blue">
                        {e.phone}
                      </a>
                      {e.email && (
                        <>
                          {" · "}
                          <a href={`mailto:${e.email}`} className="font-bold text-blue">
                            {e.email}
                          </a>
                        </>
                      )}
                      {e.fulfilment && <span className="text-muted"> · {e.fulfilment}</span>}
                    </p>
                    {e.notes && <p className="mt-2 text-sm text-ink">{e.notes}</p>}
                    <button type="button" onClick={() => markHandled(e.id, !e.handled_at)} className="mt-3 text-xs font-extrabold text-blue">
                      {e.handled_at ? "↺ Mark as not handled" : "✓ Mark as handled"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Signed-in devices */}
          <section id="devices" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">Signed-in devices</h2>
            <p className="mt-1 text-sm text-muted">
              Up to {maxSessions} staff devices can be signed in at once; the admin password never uses a slot and is never locked out. A device stays signed in while its staff tab is open — even with the screen asleep — and is signed out when the tab closes.
            </p>
            <SignedInDevices max={maxSessions} />
          </section>

          {/* Setup */}
          <section id="setup" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">Setup</h2>
            <p className="mt-1 text-sm text-muted">What&rsquo;s connected. Anything missing is set in Vercel → Settings → Environment Variables (see README).</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                ["Database & photo storage", setup.database, "Orders, kitchen board, photos, catering"],
                ["Staff login", setup.staffLogin, "Password for Kitchen & Admin"],
                ["Admin password", setup.adminLogin, "Never locked out — make it 12+ characters"],
                ["New-order alerts to the phone", setup.phoneAlerts, "Telegram message for every order"],
                ["Weekly order email", setup.weeklyEmail, "Sunday summary of the week's orders"],
                ["Lock-screen push", setup.lockScreenPush, "VAPID keys in Vercel + push table from the schema file"],
              ].map(([label, ok, note]) => (
                <li key={label as string} className="flex items-start gap-3 rounded-2xl border border-line p-3.5">
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${ok ? "bg-green-600" : "bg-ember"}`}>
                    {ok ? "✓" : "!"}
                  </span>
                  <span>
                    <b className="block text-sm text-blue-navy">{label as string}</b>
                    <span className="text-xs text-muted">{ok ? "Connected" : "Not set up yet"} · {note as string}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </StaffShell>
  );
}
