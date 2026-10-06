"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import StaffHeartbeat from "./StaffHeartbeat";
import { endTab } from "./staffTab";

/** The staff header. Kitchen never offers an Admin switch. */
export default function StaffShell({
  children,
  right,
  dark = false,
  showAdmin = true,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  dark?: boolean;
  showAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  async function signOut() {
    endTab();
    await fetch("/api/staff/session", { method: "DELETE" });
    window.location.href = "/staff";
  }
  const tabs = showAdmin
    ? [
        { href: "/kitchen", label: "Kitchen" },
        { href: "/admin", label: "Admin" },
      ]
    : [{ href: "/kitchen", label: "Kitchen" }];
  return (
    <div className={dark ? "min-h-[100svh] bg-char-900 text-white" : "min-h-[100svh] bg-porcelain"} data-tone={dark ? "dark" : undefined}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur ${dark ? "border-white/10 bg-char-900/90" : "border-line bg-white/90"}`}>
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" title="View the website">
            <span className="relative block h-9 w-9 overflow-hidden rounded-full shadow-[0_0_0_1.5px_var(--blue)]">
              <Image src="/images/medallion-192.png" alt="" fill sizes="36px" />
            </span>
            <span className={`hidden font-serif text-xl sm:block ${dark ? "text-white" : "text-blue-navy"}`}>
              {showAdmin ? "Yianni’s staff" : "Kitchen"}
            </span>
          </Link>
          {tabs.length > 1 && (
            <nav aria-label="Staff" className={`ml-2 flex rounded-full p-1 ${dark ? "bg-white/10" : "bg-mist"}`}>
              {tabs.map((t) => {
                const on = pathname === t.href;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    aria-current={on ? "page" : undefined}
                    className={`press-btn rounded-full px-4 py-1.5 text-sm font-bold transition ${
                      on
                        ? dark
                          ? "bg-white text-char-900"
                          : "bg-white text-blue-deep shadow-sm"
                        : dark
                          ? "text-white/70 hover:text-white"
                          : "text-muted hover:text-blue-deep"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          )}
          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
            {right}
            <button
              type="button"
              onClick={signOut}
              className={`press-btn rounded-full border px-3 py-1.5 text-xs font-bold ${dark ? "border-white/20 text-white/80" : "border-line text-muted"}`}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <StaffHeartbeat onReady={onReady} />
      {ready ? children : <p className={`p-10 text-center text-sm ${dark ? "text-white/60" : "text-muted"}`}>Checking sign-in…</p>}
    </div>
  );
}
