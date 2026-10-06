import { NextResponse, type NextRequest } from "next/server";
import { isStaff } from "@/lib/requireStaff";
import { isConfigured } from "@/lib/supabase";
import { readOrderingSettings, readShopFlags, writeOrderingSettings, writeShopFlags } from "@/lib/content-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The service switches: the online-ordering pause, the busy-night pacing
 * buffer and the sold-out broadcast. One bundle in, one bundle out, so the
 * kitchen board and the admin page never disagree about what's set.
 */
export async function GET() {
  if (!(await isStaff())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const [o, f] = await Promise.all([readOrderingSettings(), readShopFlags()]);
  return NextResponse.json({ ...o, ...f });
}

export async function PUT(request: NextRequest) {
  if (!(await isStaff())) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ error: "Database isn't set up yet." }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const [current, currentFlags] = await Promise.all([readOrderingSettings(), readShopFlags()]);
  const next = {
    paused: typeof body.paused === "boolean" ? body.paused : current.paused,
    message: typeof body.message === "string" && body.message.trim() ? body.message.trim().slice(0, 200) : current.message,
  };
  const busy = Number(body.busyMinutes);
  const flags = {
    busyMinutes: Number.isFinite(busy) ? Math.max(0, Math.min(120, Math.round(busy))) : currentFlags.busyMinutes,
    soldOutNote:
      body.soldOutNote === null
        ? null
        : typeof body.soldOutNote === "string" && body.soldOutNote.trim()
          ? body.soldOutNote.trim().slice(0, 140)
          : currentFlags.soldOutNote,
  };
  try {
    await writeOrderingSettings(next);
    await writeShopFlags(flags);
    return NextResponse.json({ ...next, ...flags });
  } catch (err) {
    console.error("[admin/settings] save failed:", err);
    return NextResponse.json({ error: "Could not save." }, { status: 502 });
  }
}
