import { NextResponse, type NextRequest } from "next/server";
import { notifyCatering } from "@/lib/notify";
import { insert, isConfigured } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (str(body.website, 200)) return NextResponse.json({ ok: true });

  const name = str(body.name, 60);
  const phone = str(body.phone, 24);
  const emailRaw = str(body.email, 120);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : "";
  const eventDate = str(body.eventDate, 40);
  const headcount = Math.round(Number(body.headcount));
  const fulfilment = str(body.fulfilment, 40) || "Not sure yet";
  const notes = str(body.notes, 800);

  if (!name) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if ((phone.match(/\d/g) ?? []).length < 8) {
    return NextResponse.json({ error: "Please add a phone number." }, { status: 400 });
  }
  if (!eventDate) return NextResponse.json({ error: "When is it?" }, { status: 400 });
  if (!Number.isFinite(headcount) || headcount < 1 || headcount > 5000) {
    return NextResponse.json({ error: "Roughly how many people?" }, { status: 400 });
  }

  const enquiry = { name, phone, email: email || undefined, eventDate, headcount, fulfilment, notes: notes || undefined };

  let saved = false;
  if (isConfigured()) {
    try {
      await insert("enquiries", {
        name,
        phone,
        email: email || null,
        event_date: eventDate,
        headcount,
        fulfilment,
        notes: notes || null,
      });
      saved = true;
    } catch (err) {
      console.error("[api/catering] save failed (run supabase-schema.sql?):", err);
    }
  }

  try {
    await notifyCatering(enquiry);
  } catch (err) {
    console.error("[api/catering] notify failed:", err);
    if (!saved) {
      return NextResponse.json({ error: "We couldn't send that. Please call or email us." }, { status: 502 });
    }
  }
  return NextResponse.json({ ok: true });
}
