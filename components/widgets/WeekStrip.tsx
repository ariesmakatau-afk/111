"use client";

import { hours } from "@/lib/site";
import { formatTime } from "@/lib/hours";
import { useShopNow } from "./useShopNow";

/**
 * Seven bars: how long the fire burns each day, in a 9am–11pm window, with
 * a live marker for *now* on today's row. The late Friday/Saturday nights
 * are visible at a glance — that's the whole point of the widget.
 */
export default function WeekStrip({ tone = "light" }: { tone?: "light" | "dark" }) {
  const now = useShopNow(15_000);
  const WINDOW_START = 9 * 60;
  const WINDOW_END = 23 * 60;
  const pct = (m: number) => ((m - WINDOW_START) / (WINDOW_END - WINDOW_START)) * 100;

  return (
    <div className={`week-strip ${tone === "dark" ? "week-strip--dark" : ""}`} role="img" aria-label="Trading hours across the week">
      {hours.map((h, i) => {
        const isToday = now !== null && now.clock.dayIndex === i;
        const openNow = isToday && !!now?.open;
        const left = Math.max(0, pct(h.open));
        const width = Math.min(100, pct(h.close)) - left;
        const cursor = now && isToday ? Math.min(100, Math.max(0, pct(Math.floor(now.clock.secOfDay / 60)))) : null;
        return (
          <div key={h.day} className={`week-strip__row ${isToday ? "is-today" : ""}`}>
            <span className="week-strip__day">{h.short}</span>
            <span className="week-strip__track">
              <span
                className={`week-strip__bar ${openNow ? "is-lit" : ""}`}
                style={{ left: `${left}%`, width: `${Math.max(2, width)}%` }}
                title={`${h.day}: ${formatTime(h.open)} – ${formatTime(h.close)}`}
              />
              {cursor !== null && <span className="week-strip__cursor" style={{ left: `${cursor}%` }} aria-hidden="true" />}
            </span>
            <span className="week-strip__time">{formatTime(h.open)} – {formatTime(h.close)}</span>
          </div>
        );
      })}
    </div>
  );
}
