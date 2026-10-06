// lib/session.ts
//
// Authentication for the staff area (/kitchen and /admin).
//
// Two shared passwords rather than per-user accounts: STAFF_PASSWORD for the
// crew, and ADMIN_PASSWORD for the owner/manager. That is a deliberate trade:
// casual staff come and go, and nobody wants to manage user records for a
// yiros shop. Changing a password locks out whoever no longer knows it.
//
// Each sign-in is a row in `staff_sessions`, and the cookie carries that row's
// id plus an HMAC signature, so it cannot be forged without
// STAFF_SESSION_SECRET. On top of that:
//
//   - A session lasts exactly as long as a staff tab is open. Each tab has an
//     id kept in the tab's sessionStorage (which the browser deletes when the
//     tab closes), so a new tab always asks for the password. A closing tab
//     tells the server; once a session's last tab has been closed for
//     CLOSE_GRACE_SECONDS, it's over. A sleeping screen closes nothing, so
//     the kitchen tablet stays signed in overnight.
//   - At most MAX_SESSIONS staff sessions at once; one more is turned away.
//   - Each device gets MAX_ATTEMPTS password tries per LOCK_MINUTES, then is
//     locked out for LOCK_MINUTES.
//   - The admin password is never locked out and never uses a slot, and only
//     an admin can sign an admin session out.

import { createHash, createHmac, timingSafeEqual } from "crypto";
import { insert, remove, rpc, select, update } from "./supabase";

export const SESSION_COOKIE = "yiannis_staff";
export const MAX_SESSIONS = 3;
export const CLOSE_GRACE_SECONDS = 60;
export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

export type Role = "staff" | "admin";

const SESSIONS = "staff_sessions";
const UUID_RE = /^[0-9a-f-]{36}$/i;
const TAB_RE = /^[0-9a-z-]{8,64}$/i;

function secret(): string {
  const s = process.env.STAFF_SESSION_SECRET;
  if (!s) throw new Error("STAFF_SESSION_SECRET is not set.");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/** Constant-time compare, so a wrong password can't be found by timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Which role a password unlocks, if any. The admin password is checked first. */
export function roleForPassword(candidate: string): Role | null {
  const admin = process.env.ADMIN_PASSWORD;
  if (admin && safeEqual(candidate, admin)) return "admin";
  const staff = process.env.STAFF_PASSWORD;
  if (staff && safeEqual(candidate, staff)) return "staff";
  return null;
}

const graceCutoff = () => new Date(Date.now() - CLOSE_GRACE_SECONDS * 1000).toISOString();

/** PostgREST filter for sessions that haven't ended. */
const aliveFilter = () => `or=(closing_at.is.null,closing_at.gt.${encodeURIComponent(graceCutoff())})`;

/** The session id inside a correctly signed cookie, or null. No database call. */
function sessionIdFrom(value: string | undefined): string | null {
  if (!value) return null;
  const [id, signature] = value.split(".");
  if (!id || !signature || !UUID_RE.test(id)) return null;
  try {
    return safeEqual(signature, sign(id)) ? id : null;
  } catch {
    return null; // secret missing — fail closed
  }
}

export type LiveSession = { id: string; role: Role };

/** The live session for a cookie value: signed, and not ended. */
export async function verifySessionValue(value: string | undefined): Promise<LiveSession | null> {
  const id = sessionIdFrom(value);
  if (!id) return null;
  try {
    const rows = await select<{ id: string; role: string }>(SESSIONS, `id=eq.${id}&${aliveFilter()}&select=id,role&limit=1`);
    return rows[0] ? { id: rows[0].id, role: rows[0].role === "admin" ? "admin" : "staff" } : null;
  } catch {
    return null; // database unreachable — fail closed
  }
}

/**
 * Sign in. If this browser already has a live session of the same kind (a
 * second tab, say), it's reused rather than taking another slot. Staff
 * sessions are capped at MAX_SESSIONS; admin sessions never are.
 */
export async function createSession(
  role: Role,
  device: string,
  existingCookie: string | undefined
): Promise<{ value: string } | { full: true }> {
  // Clear out sessions whose last tab closed, so they don't hold a slot.
  await remove(SESSIONS, `closing_at=lt.${encodeURIComponent(graceCutoff())}`);

  const existing = await verifySessionValue(existingCookie);
  if (existing && existing.role === role && existingCookie) return { value: existingCookie };

  // Switching roles on this browser (staff → admin, or back) replaces the old session.
  if (role === "staff") {
    const own = existing ? `&id=neq.${existing.id}` : "";
    const active = await select<{ id: string }>(SESSIONS, `role=eq.staff&${aliveFilter()}${own}&select=id`);
    if (active.length >= MAX_SESSIONS) return { full: true };
  }
  if (existing) await remove(SESSIONS, `id=eq.${existing.id}`);

  // Starts out "closing": the page the browser lands on checks in straight
  // away and cancels that, so a sign-in whose page never opens frees its slot.
  const row = await insert<{ id: string }>(SESSIONS, {
    role,
    device: device.slice(0, 80),
    closing_at: new Date().toISOString(),
  });
  return { value: `${row.id}.${sign(row.id)}` };
}

/** An open tab checks in. False when the session has already ended. */
export async function touchSession(value: string | undefined, tab: string): Promise<boolean> {
  const id = sessionIdFrom(value);
  if (!id || !TAB_RE.test(tab)) return false;
  return (await rpc<boolean>("staff_session_beat", { p_id: id, p_tab: tab, p_grace_seconds: CLOSE_GRACE_SECONDS })) === true;
}

/** A tab closed (or is reloading — then it checks back in within a second or two). */
export async function tabClosed(value: string | undefined, tab: string): Promise<void> {
  const id = sessionIdFrom(value);
  if (!id || !TAB_RE.test(tab)) return;
  await rpc("staff_session_tab_closed", { p_id: id, p_tab: tab });
}

export async function endSession(value: string | undefined): Promise<void> {
  const id = sessionIdFrom(value);
  if (id) await remove(SESSIONS, `id=eq.${id}`);
}

export type StaffSession = { id: string; role: Role; device: string | null; created_at: string; last_seen: string };

/** Sessions signed in right now, newest first. */
export async function listSessions(): Promise<StaffSession[]> {
  return select<StaffSession>(SESSIONS, `${aliveFilter()}&select=id,role,device,created_at,last_seen&order=created_at.desc`);
}

/**
 * Sign out one session, or every session except `me`. Staff can't sign out
 * an admin session; an admin can sign out anyone.
 */
export async function signOutSessions(me: LiveSession, opts: { id: string } | { allOthers: true }): Promise<void> {
  const guard = me.role === "admin" ? "" : "&role=eq.staff";
  if ("id" in opts) {
    if (UUID_RE.test(opts.id) && opts.id !== me.id) await remove(SESSIONS, `id=eq.${opts.id}${guard}`);
  } else {
    await remove(SESSIONS, `id=neq.${me.id}${guard}`);
  }
}

/**
 * Count a login attempt for this device, before the password is checked.
 * Returns how many attempts it has used in the current window, or the time
 * its lockout ends.
 */
export async function countAttempt(client: string): Promise<{ attempts: number; lockedUntil: Date | null }> {
  const rows = await rpc<{ attempts: number; locked_until: string | null }[]>("staff_login_attempt", {
    p_client: clientKey(client),
    p_window_minutes: LOCK_MINUTES,
  });
  const r = rows[0];
  const lockedUntil = r?.locked_until ? new Date(r.locked_until) : null;
  return { attempts: r?.attempts ?? 0, lockedUntil: lockedUntil && lockedUntil > new Date() ? lockedUntil : null };
}

export async function lockClient(client: string): Promise<Date> {
  const until = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
  await update("staff_login_attempts", `client=eq.${clientKey(client)}`, { locked_until: until.toISOString() });
  return until;
}

export async function clearAttempts(client: string): Promise<void> {
  await remove("staff_login_attempts", `client=eq.${clientKey(client)}`);
}

/** Devices are keyed by a keyed hash of their IP — the raw address is never stored. */
function clientKey(ip: string): string {
  return createHash("sha256").update(`${secret()}:${ip}`).digest("hex");
}

/** A short, readable device label from a User-Agent, e.g. "iPhone · Safari". */
export function deviceLabel(ua: string): string {
  const os = /iPad/.test(ua)
    ? "iPad"
    : /iPhone/.test(ua)
      ? "iPhone"
      : /Android/.test(ua)
        ? /Mobile/.test(ua) ? "Android phone" : "Android tablet"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X/.test(ua)
            ? "Mac"
            : /Linux/.test(ua)
              ? "Linux"
              : "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /SamsungBrowser/.test(ua)
      ? "Samsung Internet"
      : /Firefox\/|FxiOS/.test(ua)
        ? "Firefox"
        : /Chrome\/|CriOS/.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "browser";
  return `${os} · ${browser}`;
}
