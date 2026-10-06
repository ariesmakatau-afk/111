"use client";

/**
 * The browser side of Web Push, as three small functions — no framework,
 * no polling. enablePushFor() walks the whole ladder (permission → service
 * worker → PushManager → server upsert) and reports back the best mode the
 * device actually ended up with, so the UI can say something honest:
 *
 *   "push"       real lock-screen alerts (Android, desktop, iOS PWA)
 *   "tab"        no push here, but in-page alerts are armed (older iOS)
 *   "ios-install" iPhone Safari: install to Home Screen first
 *   "denied"     the browser says no
 */

export type PushMode = "push" | "tab" | "ios-install" | "ios-tab" | "denied" | "off";

const LS_PREFIX = "yiannis:push:";

export function pushUiSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof window !== "undefined" && "PushManager" in window && "Notification" in window
  );
}

export function savedMode(orderRef: string): PushMode | null {
  try {
    const v = localStorage.getItem(LS_PREFIX + orderRef);
    return v === "push" || v === "tab" ? v : null;
  } catch {
    return null;
  }
}

function remember(orderRef: string, mode: PushMode | null) {
  try {
    if (mode) localStorage.setItem(LS_PREFIX + orderRef, mode);
    else localStorage.removeItem(LS_PREFIX + orderRef);
  } catch {}
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

async function armPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/** iPhone/iPad in a browser tab (not opened from the Home Screen). */
function iosTab(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

export async function enablePushFor(orderRef: string): Promise<PushMode> {
  // iOS has no notifications at all in a browser tab — asking would only ever
  // look like "blocked". The kitchen installs the board to the Home Screen;
  // a customer keeps the tracker open (an installed copy wouldn't know the order).
  if (iosTab()) return orderRef === "kitchen" ? "ios-install" : "ios-tab";
  const permission = await armPermission();
  if (permission !== "granted") {
    remember(orderRef, null);
    return "denied";
  }
  if (!pushUiSupported()) {
    remember(orderRef, "tab");
    return "tab";
  }
  try {
    const res = await fetch("/api/push", { cache: "no-store" });
    const cfg = await res.json().catch(() => ({}));
    if (!cfg?.available || typeof cfg.publicKey !== "string") {
      // Server has no VAPID keys / database — in-tab alerts are still real.
      remember(orderRef, "tab");
      return "tab";
    }
    let reg: ServiceWorkerRegistration | undefined;
    try {
      // Register first: serviceWorker.ready would wait forever on a site
      // that has never installed the worker.
      reg = await navigator.serviceWorker.register("/sw.js");
      if (!reg || !("pushManager" in reg)) reg = await navigator.serviceWorker.ready;
    } catch {
      reg = undefined;
    }
    if (!reg || !("pushManager" in reg)) {
      remember(orderRef, "tab");
      return "tab";
    }
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cfg.publicKey),
      });
    }
    const json = sub.toJSON() as unknown as { endpoint: string; keys?: { p256dh?: string; auth?: string } };
    const saved = await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subscribe", orderRef, endpoint: json.endpoint, keys: json.keys }),
    });
    // Only claim "push" once the server has actually stored the device —
    // otherwise the switch says ON while nothing is ever sent.
    const result = await saved.json().catch(() => ({}));
    if (!saved.ok || result?.ok !== true) {
      remember(orderRef, "tab");
      return "tab";
    }
    remember(orderRef, "push");
    return "push";
  } catch (err) {
    // iOS refuses PushManager.subscribe() outside an installed web app.
    const name = (err as DOMException)?.name;
    if (name === "NotAllowedError" && /iPhone|iPad|Macintosh/.test(navigator.userAgent) && !matchMedia("(display-mode: standalone)").matches) {
      remember(orderRef, "tab");
      return "ios-install";
    }
    remember(orderRef, "tab");
    return "tab";
  }
}

export async function disablePushFor(orderRef: string): Promise<void> {
  remember(orderRef, null);
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager?.getSubscription();
    if (sub) {
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "unsubscribe", orderRef, endpoint: (sub.toJSON() as { endpoint: string }).endpoint }),
      });
    }
  } catch {}
}
