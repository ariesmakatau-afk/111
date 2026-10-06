import { NextResponse, type NextRequest } from "next/server";
import { staffSession } from "@/lib/requireStaff";
import { listSessions, signOutSessions, type LiveSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function list(me: LiveSession) {
  const sessions = await listSessions();
  return NextResponse.json({
    you: me.role,
    sessions: sessions.map((s) => ({ ...s, current: s.id === me.id })),
  });
}

/** Devices signed in to the staff area right now. */
export async function GET() {
  const me = await staffSession();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  try {
    return await list(me);
  } catch (err) {
    console.error("[admin/sessions] load failed:", err);
    return NextResponse.json({ error: "Could not load signed-in devices." }, { status: 502 });
  }
}

/**
 * ?id=<session> signs out one device; ?others=1 signs out everyone but you.
 * Only an admin can sign out an admin session.
 */
export async function DELETE(request: NextRequest) {
  const me = await staffSession();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  try {
    if (params.get("others") === "1") await signOutSessions(me, { allOthers: true });
    else if (id && id !== me.id) await signOutSessions(me, { id });
    else return NextResponse.json({ error: "Which device?" }, { status: 400 });
    return await list(me);
  } catch (err) {
    console.error("[admin/sessions] sign-out failed:", err);
    return NextResponse.json({ error: "Could not sign that device out." }, { status: 502 });
  }
}
