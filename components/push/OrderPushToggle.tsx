"use client";

import { useState } from "react";
import { disablePushFor, enablePushFor, savedMode, type PushMode } from "./pushClient";

/**
 * The one button on the order tracker: "tell this phone when the kitchen
 * moves". Escalates to real lock-screen push when it can; falls back to
 * in-page pings with an honest label either way.
 */
export default function OrderPushToggle({ orderRef }: { orderRef: string }) {
  const [mode, setMode] = useState<PushMode | null>(() => savedMode(orderRef));
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    if (mode) {
      await disablePushFor(orderRef);
      setMode(null);
    } else {
      setMode(await enablePushFor(orderRef));
    }
    setBusy(false);
  }

  const label =
    mode === "push"
      ? "📲 Phone alerts on — tap to stop"
      : mode === "tab"
        ? "🔔 Ping this tab when it moves — tap to stop"
        : mode === "ios-tab"
          ? "📱 iPhone: keep this page open — it updates by itself"
          : mode === "ios-install"
          ? "📲 Add the site to your Home Screen, then tap here again"
          : mode === "denied"
            ? "🔕 Alerts are blocked in this browser"
            : "📲 Send me updates on this order";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || mode === "denied"}
      className={`btn btn-glass ${mode === "push" || mode === "tab" ? "!border-amber !text-amber" : ""}`}
    >
      {busy ? "One second…" : label}
    </button>
  );
}
