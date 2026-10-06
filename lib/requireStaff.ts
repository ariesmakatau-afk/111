// lib/requireStaff.ts
//
// The real authentication check. Middleware only confirms a cookie exists;
// this verifies the signature and that the session is still live in the
// database, and runs in the Node runtime where crypto is available. Every
// protected page and API route calls it.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionValue, type LiveSession, type Role } from "@/lib/session";

/** The current request's live staff session (id and role), or null. */
export async function staffSession(): Promise<LiveSession | null> {
  return verifySessionValue((await cookies()).get(SESSION_COOKIE)?.value);
}

/** True if the current request carries a live staff session. */
export async function isStaff(): Promise<boolean> {
  return (await staffSession()) !== null;
}

export async function isAdmin(): Promise<boolean> {
  return (await staffSession())?.role === "admin";
}

/** For pages: bounce to the login screen unless signed in. */
export async function requireStaffPage(next: string, need?: Role): Promise<LiveSession> {
  const session = await staffSession();
  if (!session) {
    redirect(`/staff?next=${encodeURIComponent(next)}`);
  }
  if (need === "admin" && session.role !== "admin") {
    // Signed in as staff: ask for the admin password rather than silently
    // landing on the kitchen board.
    redirect(`/staff?next=${encodeURIComponent(next)}&need=admin`);
  }
  return session;
}
