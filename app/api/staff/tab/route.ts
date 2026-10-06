import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, tabClosed } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A staff tab is closing (sent with navigator.sendBeacon on `pagehide`).
 * If it was the session's last open tab, the session ends a minute later —
 * unless the tab was only reloading, in which case it checks back in first.
 */
export async function POST(request: NextRequest) {
  let tab = "";
  try {
    const body = JSON.parse(await request.text()) as { tab?: unknown };
    if (typeof body.tab === "string") tab = body.tab;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    await tabClosed(request.cookies.get(SESSION_COOKIE)?.value, tab);
  } catch (err) {
    console.error("[staff/tab] close failed:", err);
  }
  return NextResponse.json({ ok: true });
}
