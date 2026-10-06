"use client";

import { useEffect, useState } from "react";
import { adelaideClock } from "@/lib/shop-live";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The time in Adelaide, ticking — because a shop that closes "at eight"
 * means 8pm *here*. Renders a placeholder until the first tick.
 */
export default function AdelaideClock({ className = "", withSeconds = false }: { className?: string; withSeconds?: boolean }) {
  const [sec, setSec] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setSec(adelaideClock().secOfDay);
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (sec === null) {
    return <span className={`live-num tabular-nums ${className}`}>-:--</span>;
  }
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h >= 12 ? "pm" : "am";
  const spoken = `${h12}:${pad(m)}${suffix}`;

  return (
    <span className={`live-num tabular-nums ${className}`} aria-label={`${spoken}, Adelaide time`}>
      <span aria-hidden="true">
        {h12}
        <span className="live-num__sep">:</span>
        {pad(m)}
        {withSeconds && <span className="live-num__sec">:{pad(s)}</span>}
      </span>
      <em aria-hidden="true" className="live-num__suffix">
        {" "}
        {suffix}
      </em>
    </span>
  );
}
