"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ALERT_SOUNDS,
  DEFAULT_SOUND,
  getAlertVolume,
  playAlert,
  playConfirm,
  preloadAlert,
  setAlertVolume,
  startUrgentLoop,
  stopAlert,
  type AlertSoundId,
} from "@/lib/alertSounds";
import { formatMoney } from "@/lib/menu";
import StaffHeartbeat from "./StaffHeartbeat";
import { endTab } from "./staffTab";
import OrderOptionsSheet from "./kitchen/OrderOptionsSheet";
import KitchenSettingsSheet from "./kitchen/KitchenSettingsSheet";
import { DEFAULT_WAIT, WAIT_OPTIONS, bump, itemCount, type Order, type Patch } from "./kitchen/types";

// White, full-screen order board modelled on the Uber Eats restaurant app:
// a list on the left, the ticket on the right, one thumb-sized action.
// Orders from the website land here. The saved alarm tunes are unchanged;
// a short pager sting plays first so a new ticket is obvious in a loud shop.

const POLL_MS = 4000;

type Tab = "new" | "preparing" | "done";

function useClock(ms = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

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

function ago(created: string, clock: number): string {
  const mins = Math.max(0, Math.floor((clock - new Date(created).getTime()) / 60000));
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

export default function KitchenBoard({ isAdmin = false }: { isAdmin?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [sound, setSound] = useState<AlertSoundId>(DEFAULT_SOUND);
  const [audioReady, setAudioReady] = useState(false);
  const [volume, setVolume] = useState(1);
  const [loudMode, setLoudMode] = useState(true);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [busyMinutes, setBusyMinutes] = useState(0);
  const [soldOutNote, setSoldOutNote] = useState<string | null>(null);
  const [optionsFor, setOptionsFor] = useState<Order | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("new");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [waits, setWaits] = useState<Record<string, number>>({});
  const [undo, setUndo] = useState<{ id: string; name: string } | null>(null);
  const [alarming, setAlarming] = useState(false);
  const knownIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);
  const stopLoop = useRef<(() => void) | null>(null);
  const undoTimer = useRef(0);
  const clock = useClock();
  const wallNow = useWallClock();
  useWakeLock(audioReady);

  const onReady = useCallback(() => setReady(true), []);

  const stopUrgent = useCallback(() => {
    stopLoop.current?.();
    stopLoop.current = null;
    setAlarming(false);
  }, []);

  const beep = useCallback(
    (count: number) => {
      if (soundOn) {
        if (loudMode) {
          if (!stopLoop.current) stopLoop.current = startUrgentLoop(sound);
        } else playAlert(sound);
      }
      setAlarming(true);
      bump([180, 80, 180, 80, 280]);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(count === 1 ? "New order" : `${count} new orders`, {
            body: "Open the kitchen screen and accept it.",
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
        setTab("new");
        setSelectedId(incoming[incoming.length - 1].id);
        setShowDetail(true);
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
    if (!ready) return;
    load();
    const id = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(id);
  }, [load, ready]);

  useEffect(() => () => stopUrgent(), [stopUrgent]);
  useEffect(() => () => window.clearTimeout(undoTimer.current), []);
  useEffect(() => preloadAlert(sound), [sound]);

  function armSound() {
    setAudioReady(true);
    const waiting = orders.filter((o) => o.status === "new");
    if (waiting.length > 0 && loudMode) {
      if (!stopLoop.current) stopLoop.current = startUrgentLoop(sound);
      setAlarming(true);
      setTab("new");
      setSelectedId(waiting[waiting.length - 1].id);
      setShowDetail(true);
      return;
    }
    playAlert(sound);
    window.setTimeout(stopAlert, 900);
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
  }
  function changeVolume(v: number) {
    setVolume(v);
    setAlertVolume(v);
  }

  async function signOut() {
    endTab();
    await fetch("/api/staff/session", { method: "DELETE" });
    window.location.href = "/staff";
  }

  async function saveSettings(patchBody: Record<string, unknown>) {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchBody),
    }).catch(() => null);
    if (!res?.ok) setError("That didn't save. Check the connection and try again.");
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
      setError("That change didn't save. Pulling the latest orders.");
      load();
    }
  };

  const fresh = useMemo(() => orders.filter((o) => o.status === "new"), [orders]);
  const cooking = useMemo(() => orders.filter((o) => o.status === "accepted"), [orders]);
  const done = useMemo(() => orders.filter((o) => o.status === "collected" || o.status === "rejected"), [orders]);
  const visible = tab === "new" ? fresh : tab === "preparing" ? cooking : done;
  const selected = visible.find((o) => o.id === selectedId) ?? visible[0] ?? null;

  function pickTab(next: Tab) {
    setTab(next);
    setShowDetail(false);
  }

  function openOrder(o: Order) {
    setSelectedId(o.id);
    setShowDetail(true);
  }

  function accept(o: Order) {
    const mins = waits[o.id] ?? DEFAULT_WAIT;
    playConfirm();
    bump([18, 40, 30]);
    patch(o.id, { status: "accepted", waitMinutes: mins });
    setTab("preparing");
    setSelectedId(o.id);
  }

  function collect(o: Order) {
    playConfirm();
    bump([12, 30, 18]);
    patch(o.id, { status: "collected" });
    setUndo({ id: o.id, name: o.customer_name });
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndo(null), 5000);
    setShowDetail(false);
    setTab("preparing");
  }

  const needsArm = ready && soundOn && !audioReady;

  return (
    <div className="ue-app">
      <StaffHeartbeat onReady={onReady} />

      <header className="ue-top">
        <div className="ue-brand">
          <strong>Yianni&rsquo;s</strong>
          <span>Kitchen</span>
        </div>
        <p className="ue-clock" aria-live="off">
          {wallNow}
          <span>Adelaide</span>
        </p>
        <button
          type="button"
          className={`ue-status ${paused ? "is-paused" : "is-on"}`}
          onClick={() => setSettingsOpen(true)}
        >
          <i />
          {paused ? "Orders paused" : paused === null ? "Orders" : "Accepting orders"}
        </button>
        <div className="ue-top-actions">
          {isAdmin && (
            <Link href="/admin" className="ue-textbtn">
              Edit site
            </Link>
          )}
          <button type="button" className="ue-iconbtn" onClick={() => setSettingsOpen(true)} aria-label="Kitchen settings">
            Settings
          </button>
          <button type="button" className="ue-textbtn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      {(paused || busyMinutes > 0 || soldOutNote) && (
        <button type="button" className="ue-banner" onClick={() => setSettingsOpen(true)}>
          {paused && <b>Online orders are paused</b>}
          {busyMinutes > 0 && <b>Add {busyMinutes} min to every wait</b>}
          {soldOutNote && <span>{soldOutNote}</span>}
        </button>
      )}

      {error && (
        <p role="alert" className="ue-error">
          {error}
        </p>
      )}

      {!ready || loading ? (
        <p className="ue-empty">Loading orders…</p>
      ) : (
        <div className={`ue-body ${showDetail ? "is-detail" : ""}`}>
          <section className="ue-list" aria-label="Orders">
            <div className="ue-tabs" role="tablist">
              <TabButton id="new" label="New" count={fresh.length} hot={fresh.length > 0} current={tab} onPick={pickTab} />
              <TabButton id="preparing" label="Preparing" count={cooking.length} current={tab} onPick={pickTab} />
              <TabButton id="done" label="Done" count={done.length} current={tab} onPick={pickTab} />
            </div>
            <ul className="ue-rows">
              {visible.length === 0 ? (
                <li className="ue-empty">
                  {tab === "new"
                    ? "No new orders. When someone orders on the website, it shows up here."
                    : tab === "preparing"
                      ? "Nothing on the spit. Accepted orders wait here until they're handed over."
                      : "Nothing finished today yet."}
                </li>
              ) : (
                visible.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      className={`ue-row ${selected?.id === o.id ? "is-on" : ""} ${o.status === "new" ? "is-new" : ""}`}
                      onClick={() => openOrder(o)}
                    >
                      <span className="ue-row-top">
                        <strong>{o.customer_name}</strong>
                        <span>{ago(o.created_at, clock)}</span>
                      </span>
                      <span className="ue-row-sub">
                        {itemCount(o)} {itemCount(o) === 1 ? "item" : "items"} · {o.pickup_time}
                        {o.total != null ? ` · ${formatMoney(Number(o.total))}` : ""}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="ue-detail" aria-live="polite">
            {selected && (selected.status === "new" || selected.status === "accepted" || tab === "done") ? (
              <Ticket
                order={selected}
                clock={clock}
                busy={busyMinutes}
                wait={waits[selected.id] ?? selected.wait_minutes ?? DEFAULT_WAIT}
                onWait={(m) => setWaits((w) => ({ ...w, [selected.id]: m }))}
                onAccept={() => accept(selected)}
                onCollect={() => collect(selected)}
                onBack={() => setShowDetail(false)}
                onMore={() => setOptionsFor(selected)}
                onUndoCollect={() => patch(selected.id, { status: "accepted" })}
              />
            ) : (
              <p className="ue-empty">Pick an order.</p>
            )}
          </section>
        </div>
      )}

      {undo && (
        <div className="ue-undo" role="status">
          <span>{undo.name.split(" ")[0]} marked collected</span>
          <button
            type="button"
            onClick={() => {
              patch(undo.id, { status: "accepted" });
              setUndo(null);
              setTab("preparing");
              setSelectedId(undo.id);
              setShowDetail(true);
            }}
          >
            Undo
          </button>
        </div>
      )}

      {alarming && fresh.length > 0 && (
        <button type="button" className="ue-silence" onClick={ack}>
          Silence alarm
        </button>
      )}

      {needsArm && (
        <div className="ue-arm">
          <div>
            <p className="ue-kicker">Kitchen</p>
            <h1>Tap to hear new orders</h1>
            <p>This screen stays on. A new website order plays the alarm until you accept it.</p>
            <button type="button" className="ue-btn" onClick={armSound}>
              Open the kitchen
            </button>
          </div>
        </div>
      )}

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
    </div>
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

function TabButton({
  id,
  label,
  count,
  hot,
  current,
  onPick,
}: {
  id: Tab;
  label: string;
  count: number;
  hot?: boolean;
  current: Tab;
  onPick: (t: Tab) => void;
}) {
  const on = current === id;
  return (
    <button type="button" role="tab" aria-selected={on} className={`ue-tab ${on ? "is-on" : ""}`} onClick={() => onPick(id)}>
      {label}
      <span className={hot ? "is-hot" : ""}>{count}</span>
    </button>
  );
}

function Ticket({
  order,
  clock,
  busy,
  wait,
  onWait,
  onAccept,
  onCollect,
  onBack,
  onMore,
  onUndoCollect,
}: {
  order: Order;
  clock: number;
  busy: number;
  wait: number;
  onWait: (m: number) => void;
  onAccept: () => void;
  onCollect: () => void;
  onBack: () => void;
  onMore: () => void;
  onUndoCollect: () => void;
}) {
  const isNew = order.status === "new";
  const preparing = order.status === "accepted";
  const n = itemCount(order);
  const told = (order.wait_minutes ?? 0) + busy;
  const waited = Math.max(0, Math.floor((clock - new Date(order.created_at).getTime()) / 60000));

  return (
    <article className="ue-ticket">
      <button type="button" className="ue-back" onClick={onBack}>
        Orders
      </button>
      <header className="ue-ticket-head">
        <div>
          <p className="ue-kicker">{isNew ? "New order" : preparing ? "Preparing" : order.status === "rejected" ? "Cancelled" : "Collected"}</p>
          <h2>{order.customer_name}</h2>
          <p className="ue-meta">
            {n} {n === 1 ? "item" : "items"} · {ago(order.created_at, clock)}
          </p>
        </div>
        <a className="ue-phone" href={`tel:${order.phone}`}>
          {order.phone}
        </a>
      </header>

      <p className="ue-pickup">
        Pickup <strong>{order.pickup_time}</strong>
        {preparing && order.wait_minutes != null && (
          <span className={waited > told + 3 ? "is-late" : ""}>
            {waited} min in · told {order.wait_minutes} min{busy > 0 ? ` + ${busy}` : ""}
          </span>
        )}
      </p>

      <ul className="ue-items">
        {order.items.map((item, i) => (
          <li key={i}>
            <span className="ue-qty">{item.quantity}</span>
            <span>
              <strong>{item.name}</strong>
              {(item.detail || item.notes) && (
                <em>
                  {(item.detail ?? item.notes ?? "").split(" · ").map((part, j) => (
                    <span key={j}>
                      {j > 0 ? " · " : ""}
                      <span className={/^no\s/i.test(part) ? "is-off" : ""}>{part}</span>
                    </span>
                  ))}
                </em>
              )}
            </span>
          </li>
        ))}
      </ul>

      {order.order_notes && (
        <p className="ue-note">
          <strong>Note. </strong>
          {order.order_notes}
        </p>
      )}

      {order.total != null && (
        <p className="ue-total">
          <span>Pay at the counter</span>
          <strong>{formatMoney(Number(order.total))}</strong>
        </p>
      )}

      {isNew && (
        <div className="ue-times" role="group" aria-label="How many minutes">
          {WAIT_OPTIONS.map((m) => (
            <button key={m} type="button" className={wait === m ? "is-on" : ""} onClick={() => onWait(m)}>
              {m} min
            </button>
          ))}
        </div>
      )}
      {isNew && busy > 0 && <p className="ue-hint">Customer is told {wait + busy} min, because the shop is running {busy} min behind.</p>}

      <div className="ue-actions">
        {isNew && (
          <button type="button" className="ue-btn" onClick={onAccept}>
            Accept · {wait} min
          </button>
        )}
        {preparing && (
          <button type="button" className="ue-btn" onClick={onCollect}>
            Mark collected
          </button>
        )}
        {order.status === "collected" && (
          <button type="button" className="ue-btn ue-btn--ghost" onClick={onUndoCollect}>
            Put back on the spit
          </button>
        )}
        {order.status !== "rejected" && order.status !== "collected" && (
          <button type="button" className="ue-btn ue-btn--ghost" onClick={onMore}>
            More
          </button>
        )}
      </div>
    </article>
  );
}
