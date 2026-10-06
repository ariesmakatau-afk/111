"use client";

import { useCallback, useEffect, useState } from "react";

type Device = { id: string; role: "staff" | "admin"; device: string | null; created_at: string; last_seen: string; current: boolean };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Adelaide" });

/** Admin: who's signed in to the staff area, with a way to sign devices out. */
export default function SignedInDevices({ max }: { max: number }) {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [you, setYou] = useState<"staff" | "admin">("staff");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = useCallback(async (res: Response) => {
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
    setDevices(body.sessions ?? []);
    if (body.you === "admin" || body.you === "staff") setYou(body.you);
    setError(null);
  }, []);

  useEffect(() => {
    fetch("/api/admin/sessions", { cache: "no-store" })
      .then(apply)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load signed-in devices."));
  }, [apply]);

  async function signOut(query: string) {
    setBusy(true);
    try {
      await apply(await fetch(`/api/admin/sessions?${query}`, { method: "DELETE" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign that device out.");
    } finally {
      setBusy(false);
    }
  }

  // Staff can sign out other staff; only an admin can sign out an admin.
  const canSignOut = (d: Device) => !d.current && (you === "admin" || d.role === "staff");
  const others = devices?.filter(canSignOut).length ?? 0;
  const staffInUse = devices?.filter((d) => d.role === "staff").length ?? 0;

  return (
    <div className="mt-5">
      {error && (
        <p role="alert" className="mb-3 text-sm font-semibold text-ember-deep">
          {error}
        </p>
      )}
      {devices === null ? (
        !error && <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <p className="text-sm font-bold text-blue-navy">
            {staffInUse} of {max} staff slots in use
          </p>
          <ul className="mt-3 grid gap-2">
            {devices.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-3.5">
                <span>
                  <b className="block text-sm text-blue-navy">
                    {d.device ?? "Unknown device"}
                    {d.role === "admin" && <span className="ml-2 rounded-full bg-blue-deep px-2 py-0.5 text-[11px] font-bold text-white">Admin</span>}
                    {d.current && <span className="ml-2 text-xs font-bold text-green-700">This device</span>}
                  </b>
                  <span className="text-xs text-muted">Signed in {when(d.created_at)}</span>
                </span>
                {canSignOut(d) && (
                  <button type="button" disabled={busy} onClick={() => signOut(`id=${d.id}`)} className="btn btn-ghost btn-sm">
                    Sign out
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={busy || others === 0}
            onClick={() => signOut("others=1")}
            className="btn btn-ghost btn-sm mt-4"
          >
            Sign out all other devices
          </button>
        </>
      )}
    </div>
  );
}
