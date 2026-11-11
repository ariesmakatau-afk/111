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
  { id: "ordering", label: "Pause ordering" },
  { id: "deal", label: "The deal" },
  { id: "staff", label: "Team photos" },
  { id: "customers", label: "Customer photos" },
  { id: "catering", label: "Catering" },
  { id: "devices", label: "Devices" },
  { id: "setup", label: "What's connected" },
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
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue">Website edits</p>
            <h1 className="h-md mt-2 text-blue-navy">Change what customers see</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink">
              Photos, the deal, and whether the shop is taking online orders are changed here. New orders do not land on this page — they go to the kitchen screen.
            </p>
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
            <Link href="/kitchen" className="btn btn-blue mt-5">
              Open the kitchen
            </Link>
          </section>

          {/* Ordering switch */}
          <section id="ordering" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">Pause online ordering</h2>
            <p className="mt-1 text-base text-ink">
              Turn this off when the shop is too busy. Customers see your message and the phone number, and no new order is sent to the kitchen.
            </p>
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
            <h2 className="font-serif text-3xl text-blue-navy">The deal</h2>
            <p className="mt-1 text-base text-ink">
              The short line sits at the top of the home page. Tapping it opens the full deal at the top of the menu.
            </p>
            <DealEditor initial={deal} disabled={!setup.database} />
          </section>

          {/* Staff */}
          <section id="staff" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">Team photos</h2>
            <p className="mb-5 mt-1 text-base text-ink">
              These show on the home page and the Parea page as the team. Ask before you post anyone, and take the photo down if they leave.
            </p>
            <PhotoWall kind="team" initial={team} limit={4} />
          </section>

          {/* Customers */}
          <section id="customers" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">Customer photos</h2>
            <p className="mb-5 mt-1 text-base text-ink">
              Regulars and big nights, on the home page and the Parea page. Get a spoken yes before you post a face.
            </p>
            <PhotoWall kind="customers" initial={customers} limit={4} />
          </section>

          {/* Catering */}
          <section id="catering" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">Catering enquiries</h2>
            <p className="mt-1 text-base text-ink">From the form on the catering page. Each one also reaches the shop phone.</p>
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
            <p className="mt-1 text-base text-ink">
              Up to {maxSessions} kitchen devices can be signed in at once. This admin login does not use one of those spots. A tablet stays signed in while the kitchen tab is open, including when the screen sleeps, and signs out when the tab is closed.
            </p>
            <SignedInDevices max={maxSessions} />
          </section>

          {/* Setup */}
          <section id="setup" className="tile scroll-mt-24 p-6 hover:!translate-y-0">
            <h2 className="font-serif text-3xl text-blue-navy">What&rsquo;s connected</h2>
            <p className="mt-1 text-base text-ink">
              If something here is missing, orders or photos will not save. Those connections are set in the hosting account, not on this page.
            </p>
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
