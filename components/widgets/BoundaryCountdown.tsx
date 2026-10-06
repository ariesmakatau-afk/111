"use client";

import { countdownLabel } from "@/lib/shop-live";
import { useShopNow } from "./useShopNow";

/**
 * A ticking "Closes in 2h 14m" / "Opens in 9h 30m" chip. Shows seconds
 * once we're under ten minutes — last-call urgency should be literal.
 * `render` lets parents drop the text into their own markup.
 */
export default function BoundaryCountdown({
  render,
}: {
  render?: (label: string, urgent: boolean) => React.ReactNode;
}) {
  const now = useShopNow(1000);
  if (!now) return null;

  const urgent = now.open && now.secondsTo < 600;
  const label = countdownLabel(now, urgent);
  if (render) return <>{render(label, urgent)}</>;

  return (
    <span className={`status ${now.open ? "is-open" : ""} ${urgent ? "is-lastcall" : ""}`} role="timer" aria-live="off">
      <span className="status__dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
