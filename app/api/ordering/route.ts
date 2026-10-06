import { NextResponse } from "next/server";
import { isConfigured, readOrderingSettings, readShopFlags } from "@/lib/content-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public: is online ordering taking orders right now — and is the kitchen
 * running behind or short of something? The checkout, the menu banner and
 * the tracker all read this one line.
 */
export async function GET() {
  if (!isConfigured()) return NextResponse.json({ paused: false, tracking: false, busyMinutes: 0, soldOutNote: null });
  const [s, f] = await Promise.all([readOrderingSettings(), readShopFlags()]);
  return NextResponse.json({ paused: s.paused, message: s.message, tracking: true, busyMinutes: f.busyMinutes, soldOutNote: f.soldOutNote });
}
