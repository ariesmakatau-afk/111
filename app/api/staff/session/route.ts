import { NextResponse, type NextRequest } from "next/server";
import {
  LOCK_MINUTES,
  MAX_ATTEMPTS,
  MAX_SESSIONS,
  SESSION_COOKIE,
  clearAttempts,
  countAttempt,
  createSession,
  deviceLabel,
  endSession,
  lockClient,
  roleForPassword,
  touchSession,
  type Role,
} from "@/lib/session";
import { isConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The visitor's IP. Vercel sets these headers itself, so they can't be spoofed there. */
function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function lockedMessage(until: Date): string {
  const mins = Math.max(1, Math.ceil((until.getTime() - Date.now()) / 60000));
  return `Too many attempts from this device. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`;
}

/** Sign in. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const password = (body as Record<string, unknown>)?.password;
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  if (!(process.env.STAFF_PASSWORD || process.env.ADMIN_PASSWORD) || !process.env.STAFF_SESSION_SECRET) {
    return NextResponse.json(
      { error: "Staff login isn't set up yet. STAFF_PASSWORD, ADMIN_PASSWORD and STAFF_SESSION_SECRET are missing." },
      { status: 503 }
    );
  }
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Staff login needs the database. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const ip = clientIp(request);
  const role = roleForPassword(password);
  try {
    // The admin password is never locked out — it skips the attempt count.
    if (role !== "admin") {
      // Counted before the password is checked, so parallel guesses can't
      // get more than MAX_ATTEMPTS tries in.
      const { attempts, lockedUntil } = await countAttempt(ip);
      if (lockedUntil) return NextResponse.json({ error: lockedMessage(lockedUntil) }, { status: 429 });
      if (attempts > MAX_ATTEMPTS) {
        return NextResponse.json({ error: lockedMessage(await lockClient(ip)) }, { status: 429 });
      }
      if (!role) {
        // Deliberately vague, and slow enough to discourage guessing.
        await new Promise((r) => setTimeout(r, 600));
        if (attempts >= MAX_ATTEMPTS) {
          return NextResponse.json({ error: lockedMessage(await lockClient(ip)) }, { status: 429 });
        }
        const left = MAX_ATTEMPTS - attempts;
        return NextResponse.json(
          { error: `Wrong password. ${left} attempt${left === 1 ? "" : "s"} left before a ${LOCK_MINUTES}-minute lock.` },
          { status: 401 }
        );
      }
    }

    await clearAttempts(ip);
    const session = await createSession(
      role as Role,
      deviceLabel(request.headers.get("user-agent") ?? ""),
      request.cookies.get(SESSION_COOKIE)?.value
    );
    if ("full" in session) {
      return NextResponse.json(
        {
          error: `${MAX_SESSIONS} staff devices are already signed in. Close the staff tab on one of them, or ask the admin to sign one out.`,
        },
        { status: 409 }
      );
    }

    const res = NextResponse.json({ ok: true, role });
    // No maxAge: a browser-session cookie. The real "tab closed" signal is
    // the tab id in sessionStorage — see lib/session.ts.
    res.cookies.set(SESSION_COOKIE, session.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[staff/session] sign-in failed (run supabase-schema.sql?):", err);
    return NextResponse.json({ error: "Could not sign in right now. Try again in a moment." }, { status: 502 });
  }
}

/** Check-in from an open staff tab: { tab }. 401 once the session has ended. */
export async function PUT(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { tab?: unknown };
  const tab = typeof body.tab === "string" ? body.tab : "";
  try {
    if (await touchSession(request.cookies.get(SESSION_COOKIE)?.value, tab)) {
      return NextResponse.json({ ok: true });
    }
  } catch (err) {
    console.error("[staff/session] check-in failed:", err);
    // A database hiccup isn't a sign-out; the next check-in will tell.
    return NextResponse.json({ error: "Could not check in." }, { status: 502 });
  }
  const res = NextResponse.json({ error: "Signed out." }, { status: 401 });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

/** Sign out. */
export async function DELETE(request: NextRequest) {
  try {
    await endSession(request.cookies.get(SESSION_COOKIE)?.value);
  } catch (err) {
    console.error("[staff/session] sign-out failed:", err);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
