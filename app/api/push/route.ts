import { NextResponse, type NextRequest } from "next/server";
import { pushPublicKey, pushReady, subscribe, unsubscribe } from "@/lib/push";
import { isStaff } from "@/lib/requireStaff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Web Push endpoints. Open for customers (like the status page itself): the
 * orderRef is a UUID only the customer and the shop hold. The "kitchen"
 * bucket for staff devices needs a staff session. Everything no-ops cleanly until VAPID keys + the database
 * are configured, so the site never depends on push working.
 */

/** GET: what can this browser do? */
export async function GET() {
  return NextResponse.json({ available: pushReady(), publicKey: pushPublicKey() });
}

/** POST {type:"subscribe"|"unsubscribe", orderRef, endpoint, keys} */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const orderRef = typeof body.orderRef === "string" ? body.orderRef : "";
  const endpoint = typeof body.endpoint === "string" ? endpointish(body.endpoint) : "";
  if (!endpoint) return NextResponse.json({ error: "Bad endpoint." }, { status: 400 });

  if (body.type === "unsubscribe") {
    await unsubscribe(orderRef, endpoint);
    return NextResponse.json({ ok: true });
  }
  if (body.type !== "subscribe") return NextResponse.json({ error: "Unknown." }, { status: 400 });

  // The kitchen bucket carries every new order's name, total and pickup time,
  // so only a signed-in staff device may join it.
  if (orderRef === "kitchen" && !(await isStaff())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const keys = body.keys as { p256dh?: unknown; auth?: unknown } | undefined;
  if (typeof keys?.p256dh !== "string" || typeof keys.auth !== "string") {
    return NextResponse.json({ error: "Missing keys." }, { status: 400 });
  }
  const ok = await subscribe(orderRef, endpoint, { p256dh: keys.p256dh, auth: keys.auth });
  return NextResponse.json(ok ? { ok: true } : { ok: false, reason: "push-not-configured" });
}

/** Push endpoints are long https: URLs — reject anything else out of hand. */
function endpointish(s: string): string {
  const trimmed = s.trim();
  return /^https:\/\//.test(trimmed) && trimmed.length < 2048 ? trimmed : "";
}
