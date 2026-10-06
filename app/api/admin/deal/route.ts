import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/requireStaff";
import { isConfigured } from "@/lib/supabase";
import { writeDeal } from "@/lib/content-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The deal: a one-line banner on the home page, the full deal on /menu.
export async function PUT(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin only." }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ error: "Database isn't set up yet." }, { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const deal = {
    on: body.on === true,
    banner: String(body.banner ?? "").trim().slice(0, 120),
    details: String(body.details ?? "").trim().slice(0, 600),
  };
  if (deal.on && !deal.banner) return NextResponse.json({ error: "Write the banner line first." }, { status: 400 });
  try {
    await writeDeal(deal);
    return NextResponse.json(deal);
  } catch (err) {
    console.error("[admin/deal] save failed:", err);
    return NextResponse.json({ error: "Could not save." }, { status: 502 });
  }
}
