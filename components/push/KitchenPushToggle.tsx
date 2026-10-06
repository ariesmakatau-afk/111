"use client";

import { useState } from "react";
import { disablePushFor, enablePushFor, savedMode, type PushMode } from "./pushClient";

/**
 * The same promise on the staff side: this tablet (or the owner's phone)
 * hears about new orders even with the browser closed. orderRef is the
 * reserved "kitchen" bucket — no customer data crosses it.
 */
export default function KitchenPushToggle({ className = "" }: { className?: string }) {
  const REF = "kitchen";
  const [mode, setMode] = useState<PushMode | null>(() => savedMode(REF));
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    if (mode) {
      await disablePushFor(REF);
      setMode(null);
    } else {
      setMode(await enablePushFor(REF));
    }
    setBusy(false);
  }

  const label =
    mode === "push"
      ? "📲 Phone push: ON"
      : mode === "tab"
        ? "🔔 Device alerts: ON (tab open)"
        : mode === "ios-install"
          ? "📲 iPhone: Share → Add to Home Screen, open it from there, tap again"
          : mode === "denied"
            ? "🔕 Alerts blocked in browser"
            : "📲 Wake my phone for new orders";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || mode === "denied"}
      title="Lock-screen alerts for new orders. Works with the browser closed on Android and desktop; on iPhone it wants the Home Screen install once."
      className={`${className} kb-btn`}
    >
      {busy ? "Arming…" : label}
    </button>
  );
}
