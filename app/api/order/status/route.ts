import { NextResponse, type NextRequest } from "next/server";
import { isConfigured, select } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public status lookup, keyed by the order's unguessable UUID. Only what the
// customer needs is returned — never the phone number or email.

export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!isConfigured()) return NextResponse.json({ error: "Not available." }, { status: 503 });

  try {
    const rows = await select<Record<string, unknown>>(
      "orders",
      `id=eq.${encodeURIComponent(id)}&select=customer_name,pickup_time,status,wait_minutes,created_at,items,total&limit=1`
    ).catch(() =>
      // Older databases without the `total` column.
      select<Record<string, unknown>>(
        "orders",
        `id=eq.${encodeURIComponent(id)}&select=customer_name,pickup_time,status,wait_minutes,created_at,items&limit=1`
      )
    );
    if (rows.length === 0) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const o = rows[0];
    return NextResponse.json({
      order: { ...o, customer_name: String(o.customer_name ?? "").split(" ")[0] },
    });
  } catch (err) {
    console.error("[order/status] lookup failed:", err);
    return NextResponse.json({ error: "Could not check that order." }, { status: 502 });
  }
}
