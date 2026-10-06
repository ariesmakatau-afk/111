import { NextResponse, type NextRequest } from "next/server";
import { isStaff } from "@/lib/requireStaff";
import { isConfigured, select, update } from "@/lib/supabase";
import { readShopFlags } from "@/lib/content-store";
import { pushToOrder } from "@/lib/push";
import { formatMoney } from "@/lib/menu";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUS = ["new", "accepted", "rejected", "collected"] as const;
type Status = (typeof VALID_STATUS)[number];

/** List the last day's orders, newest first. */
export async function GET() {
  if (!(await isStaff())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Database not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  // The last 24 hours: covers a whole trading day, plus tomorrow-morning
  // orders placed the night before.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const orders = await select<Record<string, unknown>>(
      "orders",
      `created_at=gte.${since}&order=created_at.desc`
    );
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[kitchen/orders] load failed:", err);
    return NextResponse.json({ error: "Could not load orders." }, { status: 502 });
  }
}

/** Update one order's status and/or wait time. */
export async function PATCH(request: NextRequest) {
  if (!(await isStaff())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { id, status, waitMinutes, items } = body as Record<string, unknown>;

  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json({ error: "Order id is required." }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (status !== undefined) {
    if (typeof status !== "string" || !VALID_STATUS.includes(status as Status)) {
      return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    }
    patch.status = status;
  }

  if (waitMinutes !== undefined) {
    if (
      waitMinutes !== null &&
      (typeof waitMinutes !== "number" || waitMinutes < 0 || waitMinutes > 240)
    ) {
      return NextResponse.json({ error: "Wait time looks wrong." }, { status: 400 });
    }
    patch.wait_minutes = waitMinutes;
  }

  if (items !== undefined) {
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order items look wrong." }, { status: 400 });
    }
    const cleaned = items.map((raw) => {
      const row = raw as Record<string, unknown>;
      const quantity = Math.max(1, Math.min(99, Math.round(Number(row.quantity) || 1)));
      const unitPrice = Number(row.unitPrice ?? row.unit_price);
      return {
        name: String(row.name ?? "").slice(0, 80),
        detail: typeof row.detail === "string" ? row.detail.slice(0, 240) : undefined,
        notes: typeof row.notes === "string" ? row.notes.slice(0, 240) : undefined,
        quantity,
        unitPrice: Number.isFinite(unitPrice) ? unitPrice : undefined,
      };
    });
    if (cleaned.some((i) => !i.name)) {
      return NextResponse.json({ error: "Order items look wrong." }, { status: 400 });
    }
    patch.items = cleaned;
    patch.total = cleaned.reduce((s, i) => s + (i.unitPrice ?? 0) * i.quantity, 0);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const rows = await update<Record<string, unknown>>(
      "orders",
      `id=eq.${encodeURIComponent(id)}`,
      patch
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    await pingCustomer(id, rows[0]);
    return NextResponse.json({ order: rows[0] });
  } catch (err) {
    console.error("[kitchen/orders] update failed:", err);
    return NextResponse.json({ error: "Could not update the order." }, { status: 502 });
  }
}


/**
 * Tell the customer's devices what just happened to their order. Awaiting
 * with a hard 2.5s ceiling: serverless functions freeze after the response,
 * and a slow push provider must never hold up the kitchen's tap.
 */
async function pingCustomer(id: string, row: Record<string, unknown>): Promise<void> {
  const status = String(row.status ?? "");
  if (status !== "accepted" && status !== "collected" && status !== "rejected") return;
  try {
    const flags = await readShopFlags().catch(() => ({ busyMinutes: 0, soldOutNote: null }));
    const wait = Number(row.wait_minutes);
    const mins = (Number.isFinite(wait) && wait > 0 ? wait : 0) + (flags.busyMinutes || 0);
    const payload =
      status === "accepted"
        ? {
            title: "🔥 On the spit",
            body: mins > 0 ? `About ${mins} minutes · pickup ${String(row.pickup_time ?? "ASAP")}` : `The kitchen's on it · pickup ${String(row.pickup_time ?? "ASAP")}`,
            url: `/order/status/${id}`,
            tag: `yiannis-${id}`,
          }
        : status === "collected"
          ? {
              title: "✅ Picked up — kali orexi",
              body: "Thanks for coming in. See you next time.",
              url: `/order/status/${id}`,
              tag: `yiannis-${id}`,
            }
          : {
              title: "We couldn\u2019t take this order",
              body: `Give us a ring and we\u2019ll sort it out — ${site.phone}.`,
              url: `/order/status/${id}`,
              tag: `yiannis-${id}`,
            };
    await Promise.race([pushToOrder(id, payload), new Promise((r) => setTimeout(r, 2500))]);
  } catch (err) {
    console.error("[kitchen/orders] push failed:", err);
  }
}
