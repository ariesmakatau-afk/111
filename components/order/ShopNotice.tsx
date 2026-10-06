"use client";

import { useEffect, useState } from "react";

/**
 * Whatever the kitchen has flipped on right now — a sold-out line or a
 * pacing buffer — shown at the exact moment it can save someone an
 * annoying phone call: while choosing and while checking out. Polls the
 * same public endpoint the checkout pause already uses. Renders nothing
 * when there's nothing to say.
 */
export default function ShopNotice() {
  const [flags, setFlags] = useState<{ soldOutNote: string | null; busyMinutes: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/ordering", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((b) => {
          if (!alive || !b) return;
          setFlags({
            soldOutNote: typeof b.soldOutNote === "string" && b.soldOutNote ? b.soldOutNote : null,
            busyMinutes: Number(b.busyMinutes) || 0,
          });
        })
        .catch(() => {});
    load();
    const t = window.setInterval(load, 30000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  if (!flags || (!flags.soldOutNote && flags.busyMinutes <= 0)) return null;

  return (
    <div className="space-y-2" role="status">
      {flags.soldOutNote && (
        <p className="rounded-2xl border border-ember/30 bg-[#fff1e8] px-4 py-2.5 text-sm font-bold text-ember-deep">
          <span aria-hidden="true">⚠️</span> {flags.soldOutNote}
        </p>
      )}
      {flags.busyMinutes > 0 && (
        <p className="rounded-2xl border border-blue/20 bg-mist px-4 py-2.5 text-sm font-semibold text-blue-deep">
          The kitchen&rsquo;s pushing every order <b>+{flags.busyMinutes} minutes</b> tonight — worth it, honest.
        </p>
      )}
    </div>
  );
}
