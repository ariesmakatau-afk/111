import { NextResponse, type NextRequest } from "next/server";
import { notifyOrder } from "@/lib/notify";
import { MAX_LINES, productById, sanitiseLine, toOrderItem } from "@/lib/order";
import { insert, isConfigured } from "@/lib/supabase";
import { readOrderingSettings } from "@/lib/content-store";
import { pushToOrder } from "@/lib/push";
import { formatMoney } from "@/lib/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pay-in-store pickup orders. No payment is processed here: the order is
// re-priced from the menu, saved for the kitchen board, and sent to the
// shop's phone.

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: a field real customers never see. Bots fill it; pretend success.
  if (str(body.website, 200)) return NextResponse.json({ ok: true, orderId: null });

  const customerName = str(body.customerName, 60);
  const phone = str(body.phone, 24);
  const pickupTime = str(body.pickupTime, 60);
  const orderNotes = str(body.orderNotes, 400);
  const emailRaw = str(body.email, 120);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : "";

  if (!customerName) return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  if ((phone.match(/\d/g) ?? []).length < 8) {
    return NextResponse.json({ error: "Please add a phone number we can reach you on." }, { status: 400 });
  }
  if (!pickupTime) return NextResponse.json({ error: "Please pick a pickup time." }, { status: 400 });

  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  if (rawLines.length === 0 || rawLines.length > MAX_LINES) {
    return NextResponse.json({ error: "Your order is empty." }, { status: 400 });
  }
  const lines = rawLines.map(sanitiseLine);
  if (lines.some((l) => l === null)) {
    return NextResponse.json(
      { error: "Something in your order has changed on the menu. Please rebuild it and try again." },
      { status: 400 }
    );
  }

  if (isConfigured()) {
    const settings = await readOrderingSettings();
    if (settings.paused) return NextResponse.json({ error: settings.message, paused: true }, { status: 409 });
  }

  const items = lines.map((l) => toOrderItem(productById(l!.productId)!, l!));
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  // Save first, so the kitchen board has it even if the phone alert fails.
  let orderId: string | null = null;
  if (isConfigured()) {
    const row = {
      customer_name: customerName,
      phone,
      pickup_time: pickupTime,
      email: email || null,
      order_notes: orderNotes || null,
      items,
      total,
      status: "new",
    };
    try {
      orderId = (await insert<{ id: string }>("orders", row))?.id ?? null;
    } catch (err) {
      // Databases created for the previous site have no `total` column
      // until the migration in supabase-schema.sql is run.
      try {
        const { total: _omit, ...legacy } = row;
        orderId = (await insert<{ id: string }>("orders", legacy))?.id ?? null;
      } catch (err2) {
        console.error("[api/order] could not save order:", err, err2);
      }
    }
  }

  try {
    await notifyOrder({
      customerName,
      phone,
      pickupTime,
      items,
      total,
      orderNotes: orderNotes || undefined,
      email: email || undefined,
      statusUrl: orderId ? `/order/status/${orderId}` : undefined,
    });
  } catch (err) {
    console.error("[api/order] notify failed:", err);
    // Saved to the kitchen board? Then the shop will still see it.
    if (!orderId) {
      return NextResponse.json(
        { error: "We couldn't get your order to the shop. Please call us instead." },
        { status: 502 }
      );
    }
  }

  // Wake the staff devices with the order (no customer PII beyond a name —
  // the ticket itself is a tap away, on the board). Capped so a slow push
  // provider can never hold up the customer's "order sent" moment.
  if (orderId) {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    try {
      await Promise.race([
        pushToOrder("kitchen", {
          title: `🔥 New order — ${customerName}`,
          body: `${count} ${count === 1 ? "item" : "items"} · ${formatMoney(total)} · pickup ${pickupTime}`,
          url: "/kitchen",
          tag: "yiannis-kitchen",
          urgent: true,
        }),
        new Promise((r) => setTimeout(r, 2000)),
      ]);
    } catch (err) {
      console.error("[api/order] kitchen push failed:", err);
    }
  }

  return NextResponse.json({ ok: true, orderId, total });
}
