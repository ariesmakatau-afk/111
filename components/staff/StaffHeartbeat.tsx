"use client";

import { useEffect } from "react";
import { currentTab } from "./staffTab";

const CHECK_IN_MS = 60 * 1000;

const toLogin = () => {
  window.location.href = `/staff?next=${encodeURIComponent(window.location.pathname)}`;
};

/**
 * Keeps this tab's staff sign-in alive for as long as the tab is open — a
 * sleeping screen included. A tab that wasn't signed in itself (a new or
 * reopened tab) goes to the sign-in screen. When the tab closes it tells the
 * server, which ends the session a minute later unless another staff tab in
 * this browser is still open, or this one was only reloading.
 */
export default function StaffHeartbeat({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const tab = currentTab();
    if (!tab) {
      toLogin();
      return;
    }
    let stopped = false;
    async function checkIn() {
      try {
        const res = await fetch("/api/staff/session", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tab }),
          cache: "no-store",
        });
        if (stopped) return;
        if (res.status === 401) {
          stopped = true;
          toLogin();
        } else {
          onReady();
        }
      } catch {
        // Offline for a moment: show the page anyway; the next check-in will tell.
        if (!stopped) onReady();
      }
    }
    checkIn();
    const timer = window.setInterval(checkIn, CHECK_IN_MS);
    // Back from a sleeping screen, a background tab or the back button.
    const onVisible = () => document.visibilityState === "visible" && checkIn();
    const onShow = (e: PageTransitionEvent) => e.persisted && checkIn();
    const onHide = () => {
      navigator.sendBeacon?.("/api/staff/tab", new Blob([JSON.stringify({ tab })], { type: "text/plain" }));
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onShow);
    window.addEventListener("pagehide", onHide);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("pagehide", onHide);
    };
  }, [onReady]);
  return null;
}
