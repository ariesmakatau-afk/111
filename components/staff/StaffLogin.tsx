"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { startTab } from "./staffTab";

type Role = "staff" | "admin";

/** Where a role lands: the admin password opens Admin, the staff one the Kitchen. */
function destination(role: Role, next: string | null): string {
  if (role === "admin") return next ?? "/admin";
  return next && !next.startsWith("/admin") ? next : "/kitchen";
}

export default function StaffLogin({
  next,
  needAdmin = false,
  signedInAs = null,
}: {
  next: string | null;
  needAdmin?: boolean;
  signedInAs?: Role | null;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Already signed in (and not here because a page needs the admin password):
  // show where to go instead of the password box.
  const [showForm, setShowForm] = useState(!signedInAs || (needAdmin && signedInAs !== "admin"));

  function go(href: string) {
    startTab();
    router.replace(href);
    router.refresh();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not sign in.");
      const role: Role = body.role === "admin" ? "admin" : "staff";
      if (needAdmin && role !== "admin") throw new Error("That's the staff password. Admin needs the admin password.");
      go(destination(role, next));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setBusy(false);
    }
  }

  return (
    <div className="tile w-full max-w-sm p-8 hover:!translate-y-0">
      <span className="relative block h-14 w-14 overflow-hidden rounded-full shadow-[0_0_0_2px_var(--blue)]">
        <Image src="/images/medallion-192.png" alt="" fill sizes="56px" />
      </span>
      <p className="eyebrow mt-6">Staff only</p>

      {!showForm && signedInAs ? (
        <>
          <h1 className="h-md mt-2 text-blue-navy">You&rsquo;re signed in</h1>
          <p className="mt-2 text-sm text-muted">As {signedInAs === "admin" ? "admin" : "staff"}. Where to?</p>
          <div className="mt-6 grid gap-3">
            <button type="button" onClick={() => go("/kitchen")} className="btn btn-fire w-full">
              Kitchen board
            </button>
            {signedInAs === "admin" && (
              <button type="button" onClick={() => go("/admin")} className="btn btn-blue w-full">
                Admin
              </button>
            )}
            <button type="button" onClick={() => setShowForm(true)} className="text-sm font-bold text-muted hover:text-blue-deep">
              Sign in with a different password
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="h-md mt-2 text-blue-navy">Sign in</h1>
          <p className="mt-2 text-sm text-muted">
            {needAdmin ? "Admin needs the admin password." : "Staff password opens the kitchen board. Admin password opens admin."}
          </p>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <label className="field">
              <span>Password</span>
              <input type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && (
              <p role="alert" className="text-sm font-semibold text-ember-deep">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn btn-fire w-full">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
