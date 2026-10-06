import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/requireStaff";
import { isConfigured, select, update } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin only." }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ enquiries: [] });
  try {
    const enquiries = await select("enquiries", "order=created_at.desc&limit=50");
    return NextResponse.json({ enquiries });
  } catch (err) {
    console.error("[admin/enquiries] load failed:", err);
    return NextResponse.json({ error: "Could not load enquiries." }, { status: 502 });
  }
}

/** Mark an enquiry handled (or not). */
export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin only." }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.id !== "string" || typeof body.handled !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  try {
    const rows = await update("enquiries", `id=eq.${encodeURIComponent(body.id)}`, {
      handled_at: body.handled ? new Date().toISOString() : null,
    });
    return NextResponse.json({ enquiry: rows[0] ?? null });
  } catch (err) {
    console.error("[admin/enquiries] update failed:", err);
    return NextResponse.json({ error: "Could not save." }, { status: 502 });
  }
}
