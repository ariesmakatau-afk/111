"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALERT_SOUNDS,
  DEFAULT_SOUND,
  getAlertVolume,
  playAlert,
  preloadAlert,
  setAlertVolume,
  startUrgentLoop,
  stopAlert,
  type AlertSoundId,
} from "@/lib/alertSounds";
import { formatMoney } from "@/lib/menu";
import { igniteAt } from "@/lib/embers";
import StaffShell from "./StaffShell";
import AcceptSheet from "./kitchen/AcceptSheet";
import OrderOptionsSheet from "./kitchen/OrderOptionsSheet";
import KitchenSettingsSheet from "./kitchen/KitchenSettingsSheet";
import { bump, type Order, type Patch } from "./kitchen/types";

// The kitchen board. Each ticket has one big action (Accept, then Collected)
// and a ⋯ menu for everything else; shop-wide switches and the alarm live in
// Settings. A new order sets off an alarm that keeps going until silenced.

const POLL_MS = 8000;

function useClock(ms = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

/** Keep the tablet screen on while the board is open (where supported). */
function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    type Lock = { release: () => Promise<void> };
    let lock: Lock | null = null;
    const nav = navigator as Navigator & { wakeLock: { request: (t: "screen") => Promise<Lock> } };
    const grab = () => {
      if (document.visibilityState === "visible") nav.wakeLock.request("screen").then((l) => (lock = l), () => {});
    };
    grab();
    document.addEventListener("visibilitychange", grab);
    return () => {
      document.removeEventListener("visibilitychange", grab);
      lock?.release().catch(() => {});
    };
  }, [active]);
}

export default function KitchenBoard({ isAdmin = false }: { isAdmin?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [sound, setSound] = useState<AlertSoundId>(DEFAULT_SOUND);
  const [audioReady, setAudioReady] = useState(false);
  const [volume, setVolume] = useState(1);
  const [loudMode, setLoudMode] = useState(true);
  const [unacked, setUnacked] = useState(0);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [busyMinutes, setBusyMinutes] = useState(0);
  const [soldOutNote, setSoldOutNote] = useState<string | null>(null);
  const [hotIds, setHotIds] = useState<Set<string>>(new Set());
  const [acceptFor, setAcceptFor] = useState<Order | null>(null);
  const [optionsFor, setOptionsFor] = useState<Order | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);
  const stopLoop = useRef<(() => void) | null>(null);
  const clock = useClock();
  const wallNow = useWallClock();
  useWakeLock(audioReady);

  const stopUrgent = useCallback(() => {
    stopLoop.current?.();
    stopLoop.current = null;
  }, []);

  const beep = useCallback(
    (count: number) => {
      if (soundOn) {
        // The loop plays straight away, so don't also play a one-off on top.
        if (loudMode) {
          if (!stopLoop.current) stopLoop.current = startUrgentLoop(sound);
        } else playAlert(sound);
      }
      bump([400, 150, 400, 150, 400]);
      setUnacked((n) => n + count);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(`${count} new order${count > 1 ? "s" : ""} at Yianni's`, {
            body: "Accept it on the kitchen board.",
            tag: "yiannis-new-order",
          });
        } catch {}
      }
    },
    [soundOn, sound, loudMode]
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kitchen/orders", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/staff?next=/kitchen";
        return;
      }
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not load orders.");
      const next: Order[] = body.orders ?? [];
      const incoming = next.filter((o) => o.status === "new" && !knownIds.current.has(o.id));
      if (!firstLoad.current && incoming.length > 0) {
        beep(incoming.length);
        const ids = new Set(incoming.map((o) => o.id));
        setHotIds((prev) => new Set([...prev, ...ids]));
        window.setTimeout(() => {
          setHotIds((prev) => {
            const copy = new Set(prev);
            ids.forEach((id) => copy.delete(id));
            return copy;
          });
        }, 7000);
      }
      next.forEach((o) => knownIds.current.add(o.id));
      firstLoad.current = false;
      setOrders(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, [beep]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("yiannis_alert_sound");
      if (saved && ALERT_SOUNDS.some((s) => s.id === saved)) setSound(saved as AlertSoundId);
      if (localStorage.getItem("yiannis_alert_on") === "0") setSoundOn(false);
      if (localStorage.getItem("yiannis_alert_loud") === "0") setLoudMode(false);
      setVolume(getAlertVolume());
    } catch {}
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!s) return;
        setPaused(Boolean(s.paused));
        setBusyMinutes(Number(s.busyMinutes) || 0);
        setSoldOutNote(typeof s.soldOutNote === "string" && s.soldOutNote ? s.soldOutNote : null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => () => stopUrgent(), [stopUrgent]);

  // Have the chosen alarm downloaded before the first order arrives.
  useEffect(() => preloadAlert(sound), [sound]);

  function armSound() {
    setAudioReady(true);
    // A short test so staff know it works, not the whole 20-second file.
    playAlert(sound);
    window.setTimeout(stopAlert, 1500);
  }
  function chooseSound(id: AlertSoundId) {
    setSound(id);
    try {
      localStorage.setItem("yiannis_alert_sound", id);
    } catch {}
    playAlert(id);
  }
  function toggleSound() {
    setSoundOn((on) => {
      try {
        localStorage.setItem("yiannis_alert_on", on ? "0" : "1");
      } catch {}
      if (on) stopUrgent();
      return !on;
    });
  }
  function toggleLoud() {
    setLoudMode((v) => {
      try {
        localStorage.setItem("yiannis_alert_loud", v ? "0" : "1");
      } catch {}
      if (v) stopUrgent();
      return !v;
    });
  }
  function ack() {
    stopUrgent();
    stopAlert();
    setUnacked(0);
  }
  function changeVolume(v: number) {
    setVolume(v);
    setAlertVolume(v);
  }

  async function saveSettings(patchBody: Record<string, unknown>) {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody),
    }).catch(() => null);
    if (!res?.ok) setError("A switch didn't save — check the database is configured.");
    return res?.ok ?? false;
  }

  async function togglePause() {
    const next = !paused;
    setPaused(next);
    if (!(await saveSettings({ paused: next }))) setPaused(!next);
  }
  async function setBuffer(mins: number) {
    setBusyMinutes(mins);
    if (!(await saveSettings({ busyMinutes: mins }))) load();
  }
  async function publishSoldOut(note: string | null) {
    setSoldOutNote(note);
    await saveSettings({ soldOutNote: note });
  }

  const patch: Patch = async (id, patchBody) => {
    // Any action on the board means someone's looking: silence the alarm.
    ack();
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const items = (patchBody.items as Order["items"] | undefined) ?? o.items;
        const total = patchBody.items ? items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.quantity, 0) : o.total;
        return {
          ...o,
          ...(patchBody.status ? { status: patchBody.status as Order["status"] } : {}),
          ...(patchBody.waitMinutes !== undefined ? { wait_minutes: patchBody.waitMinutes as number | null } : {}),
          ...(patchBody.items ? { items, total } : {}),
        };
      })
    );
    try {
      const res = await fetch("/api/kitchen/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patchBody }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError("That change didn't save — reloading.");
      load();
    }
  };

  const fresh = orders.filter((o) => o.status === "new");
  const cooking = orders.filter((o) => o.status === "accepted");
  const done = orders.filter((o) => o.status === "collected" || o.status === "rejected");
  const queueMinutes = cooking.length ? Math.max(...cooking.map((o) => Math.floor((clock - new Date(o.created_at).getTime()) / 60000))) : 0;

  return (
    <StaffShell
      dark
      showAdmin={isAdmin}
      right={
        <>
          <span className="mr-1 hidden font-serif text-2xl tabular-nums text-white/90 sm:inline">{wallNow}</span>
          {fresh.length > 0 && (
            <span className="kb-new-flag rounded-full bg-ember px-3 py-1.5 text-xs font-extrabold text-white">{fresh.length} incoming</span>
          )}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="press-btn rounded-full border border-white/20 px-4 py-1.5 text-sm font-bold text-white/85 hover:border-amber"
          >
            ⚙ Settings
          </button>
        </>
      }
    >
      {unacked > 0 && <div className="kb-alarm-flash" aria-hidden="true" />}
      {unacked > 0 && (
        <div className="kb-urgentbar" role="alert">
          <span>
            {unacked} new order{unacked > 1 ? "s" : ""}
          </span>
          <button
            type="button"
            onClick={(e) => {
              igniteAt(e.currentTarget, 20, 0.8);
              bump();
              ack();
            }}
            className="press-btn press-btn--light rounded-full px-6 py-2.5 text-base"
          >
            Silence alarm
          </button>
        </div>
      )}

      {soundOn && !audioReady && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <button type="button" onClick={armSound} className="press-btn press-btn--accept px-7 py-4 text-lg shadow-2xl">
            Tap to turn the alarm on
          </button>
        </div>
      )}

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {error && (
          <p role="alert" className="mb-4 rounded-2xl bg-ember/15 px-4 py-3 text-sm font-semibold text-amber">
            {error}
          </p>
        )}

        {/* Only what's switched on shows here; tapping it opens Settings. */}
        {(paused || busyMinutes > 0 || soldOutNote) && (
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="mb-6 flex w-full flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-bold"
          >
            {paused && <span className="rounded-full bg-ember px-3 py-1 text-white">Online orders paused</span>}
            {busyMinutes > 0 && <span className="rounded-full bg-amber/20 px-3 py-1 text-amber">Pacing +{busyMinutes} min</span>}
            {soldOutNote && <span className="rounded-full bg-white/10 px-3 py-1 text-white/85">{soldOutNote}</span>}
          </button>
        )}

        {loading ? (
          <p className="py-24 text-center text-white/50">Loading orders…</p>
        ) : (
          <div className="grid gap-8 xl:grid-cols-2">
            <Column title="Incoming" count={fresh.length} tone="new" empty="Nothing waiting. New orders land here with the alarm.">
              {fresh.map((o) => (
                <OrderCard key={o.id} order={o} clock={clock} busy={busyMinutes} hot={hotIds.has(o.id)} onAccept={() => setAcceptFor(o)} onOptions={() => setOptionsFor(o)} onPatch={patch} />
              ))}
            </Column>
            <Column
              title="In progress"
              count={cooking.length}
              tone="cooking"
              empty="Accepted orders wait here until they're collected."
              note={cooking.length ? `oldest ${queueMinutes}m` : undefined}
            >
              {cooking.map((o) => (
                <OrderCard key={o.id} order={o} clock={clock} busy={busyMinutes} hot={false} onAccept={() => {}} onOptions={() => setOptionsFor(o)} onPatch={patch} />
              ))}
            </Column>
          </div>
        )}

        {done.length > 0 && (
          <details className="mt-10 rounded-2xl border border-white/10 p-4">
            <summary className="cursor-pointer text-sm font-bold text-white/60">Finished in the last day ({done.length})</summary>
            <ul className="mt-3 space-y-1.5">
              {done.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-3 text-sm text-white/60">
                  <span className={o.status === "rejected" ? "text-ember" : "text-green-400"}>{o.status === "rejected" ? "✕" : "✓"}</span>
                  <span className="font-bold text-white/85">{o.customer_name}</span>
                  <span>{o.pickup_time}</span>
                  {o.total != null && <span className="tabular-nums">{formatMoney(Number(o.total))}</span>}
                  {o.status === "collected" && (
                    <button type="button" className="press-btn text-xs font-bold text-amber underline" onClick={() => patch(o.id, { status: "accepted" })}>
                      undo
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </main>

      <AcceptSheet
        order={acceptFor}
        busy={busyMinutes}
        onClose={() => setAcceptFor(null)}
        onAccept={(o, mins) => {
          setAcceptFor(null);
          patch(o.id, { status: "accepted", waitMinutes: mins });
        }}
      />
      <OrderOptionsSheet
        order={optionsFor}
        paused={paused}
        onClose={() => setOptionsFor(null)}
        onPatch={patch}
        onSoldOut={publishSoldOut}
        onTogglePause={togglePause}
      />
      <KitchenSettingsSheet
        open={settingsOpen}
        onClose={() => {
          stopAlert();
          setSettingsOpen(false);
        }}
        paused={paused}
        onTogglePause={togglePause}
        busyMinutes={busyMinutes}
        onBuffer={setBuffer}
        soldOutNote={soldOutNote}
        onSoldOut={publishSoldOut}
        sound={sound}
        onSound={chooseSound}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        volume={volume}
        onVolume={changeVolume}
        loudMode={loudMode}
        onToggleLoud={toggleLoud}
      />
    </StaffShell>
  );
}

function useWallClock() {
  const [s, setS] = useState("");
  useEffect(() => {
    const f = () =>
      setS(new Date().toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Adelaide" }));
    f();
    const t = window.setInterval(f, 15000);
    return () => window.clearInterval(t);
  }, []);
  return s;
}

function Column({
  title,
  count,
  tone,
  empty,
  note,
  children,
}: {
  title: string;
  count: number;
  tone: "new" | "cooking";
  empty: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex flex-wrap items-center gap-3 font-serif text-3xl">
        {title}
        <span
          key={count}
          className={`kb-count-pulse grid h-8 min-w-8 place-items-center rounded-full px-2 font-sans text-sm font-extrabold ${
            tone === "new" && count ? "bg-ember text-white shadow-[0_0_18px_rgba(255,90,30,.7)]" : "bg-white/10 text-white/70"
          }`}
        >
          {count}
        </span>
        {note && <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">{note}</span>}
      </h2>
      <div className="mt-4 grid gap-4">
        {count === 0 ? <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/45">{empty}</p> : children}
      </div>
    </section>
  );
}

function OrderCard({
  order,
  clock,
  busy,
  hot,
  onAccept,
  onOptions,
  onPatch,
}: {
  order: Order;
  clock: number;
  busy: number;
  hot: boolean;
  onAccept: () => void;
  onOptions: () => void;
  onPatch: Patch;
}) {
  const isNew = order.status === "new";
  const placed = new Date(order.created_at).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Australia/Adelaide",
  });
  const waitedMin = Math.max(0, Math.floor((clock - new Date(order.created_at).getTime()) / 60000));
  const told = (order.wait_minutes ?? 0) + busy;
  const etaClass = !isNew && order.wait_minutes != null ? (waitedMin > told + 3 ? "kb-eta is-late" : waitedMin >= told ? "kb-eta is-warm" : "kb-eta") : "kb-eta";

  return (
    <article
      className={`kb-card${hot ? " kb-card--new" : ""} rounded-[22px] border p-5 ${
        isNew
          ? "border-ember/60 bg-[linear-gradient(180deg,rgba(255,91,31,.14),rgba(255,91,31,.04))] shadow-[0_0_0_1px_rgba(255,91,31,.3),0_20px_50px_-20px_rgba(255,90,20,.5)]"
          : "border-blue-bright/40 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-serif text-[1.9rem] leading-none">{order.customer_name}</p>
          <a href={`tel:${order.phone}`} className="mt-1 inline-block text-sm font-bold text-blue-sky">
            {order.phone}
          </a>
        </div>
        <div className="shrink-0 text-right">
          <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-wide ${isNew ? "bg-ember text-white" : "bg-blue text-white"}`}>
            {isNew ? "Incoming" : "In progress"}
          </span>
          <p className="mt-1.5 text-xs text-white/45">placed {placed}</p>
        </div>
      </div>

      <p className="mt-3 text-base">
        <span className="text-white/50">Pickup</span> <b>{order.pickup_time}</b>
        {!isNew && order.wait_minutes != null && (
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${etaClass}`}>
            {waitedMin}m waited · told {order.wait_minutes}m{busy > 0 ? ` +${busy}` : ""}
          </span>
        )}
      </p>

      <ul className="mt-4 space-y-2.5 border-t border-white/10 pt-4">
        {order.items.map((item, i) => (
          <li key={i} className="text-[1.02rem] leading-snug">
            <b className="text-amber">{item.quantity}×</b> <b>{item.name}</b>
            {(item.detail || item.notes) && (
              <span className={`block text-sm ${/no\s|NO\s/.test(item.detail ?? "") ? "font-bold text-amber" : "text-white/60"}`}>
                {item.detail ?? item.notes}
              </span>
            )}
          </li>
        ))}
      </ul>

      {order.order_notes && (
        <p className="mt-3 rounded-xl bg-amber/15 px-3 py-2 text-sm text-amber">
          <b>Note:</b> {order.order_notes}
        </p>
      )}
      {order.total != null && (
        <p className="mt-3 flex justify-between border-t border-white/10 pt-3 text-sm text-white/60">
          <span>Pay at counter</span>
          <b className="font-serif text-xl font-normal tabular-nums text-gold">{formatMoney(Number(order.total))}</b>
        </p>
      )}

      <div className="mt-4 flex gap-2.5">
        {isNew ? (
          <button type="button" onClick={onAccept} className="press-btn press-btn--accept min-h-[60px] flex-1 text-xl">
            Accept
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              igniteAt(e.currentTarget, 26, 1);
              bump();
              onPatch(order.id, { status: "collected" });
            }}
            className="press-btn press-btn--accept min-h-[60px] flex-1 text-xl"
          >
            Collected
          </button>
        )}
        <button
          type="button"
          onClick={onOptions}
          aria-label={`More options for ${order.customer_name}'s order`}
          className="press-btn grid min-h-[60px] w-[60px] place-items-center rounded-2xl border border-white/20 text-2xl font-black text-white/80 hover:border-white/45"
        >
          ⋯
        </button>
      </div>
    </article>
  );
}
