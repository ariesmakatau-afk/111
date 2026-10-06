import { NextResponse, type NextRequest } from "next/server";
import { site } from "@/lib/site";
import { formatMoney } from "@/lib/menu";
import { escapeHtml } from "@/lib/notify";
import { isConfigured, select, update } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Weekly digest: email the week's orders, then mark them archived. Orders
// are never deleted — they're the sales record. Triggered by the cron in
// vercel.json and guarded by CRON_SECRET. Carried over from the previous
// site, now with order totals and HTML-escaped customer input.

type Item = { name: string; detail?: string; quantity: number; unitPrice?: number; notes?: string };
type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  pickup_time: string;
  email: string | null;
  order_notes: string | null;
  items: Item[];
  total?: number | null;
  status: string;
};

function authorised(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

function buildHtml(orders: Order[]): string {
  const e = escapeHtml;
  const fmt = (d: Date) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Adelaide" });
  const range = `${fmt(new Date(orders[0].created_at))} – ${fmt(new Date(orders[orders.length - 1].created_at))}`;
  const counts = orders.reduce<Record<string, number>>((acc, o) => ({ ...acc, [o.status]: (acc[o.status] ?? 0) + 1 }), {});
  const takings = orders.filter((o) => o.status === "collected").reduce((s, o) => s + Number(o.total ?? 0), 0);

  const rows = orders
    .map((o) => {
      const items = o.items
        .map((i) => `${i.quantity}× ${e(i.name)}${i.detail ? ` — ${e(i.detail)}` : ""}${i.notes ? ` (${e(i.notes)})` : ""}`)
        .join("<br>");
      const time = new Date(o.created_at).toLocaleString("en-AU", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Australia/Adelaide",
      });
      return `<tr style="border-bottom:1px solid #e3e9f2">
        <td style="padding:10px 8px;vertical-align:top;white-space:nowrap">${time}</td>
        <td style="padding:10px 8px;vertical-align:top"><strong>${e(o.customer_name)}</strong><br><span style="color:#667">${e(o.phone)}</span>${o.email ? `<br><span style="color:#667">${e(o.email)}</span>` : ""}</td>
        <td style="padding:10px 8px;vertical-align:top">${items}${o.order_notes ? `<br><em style="color:#846">Note: ${e(o.order_notes)}</em>` : ""}</td>
        <td style="padding:10px 8px;vertical-align:top;white-space:nowrap">${e(o.pickup_time)}</td>
        <td style="padding:10px 8px;vertical-align:top;white-space:nowrap">${o.total != null ? formatMoney(Number(o.total)) : "—"}</td>
        <td style="padding:10px 8px;vertical-align:top;text-transform:capitalize">${e(o.status)}</td>
      </tr>`;
    })
    .join("");

  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#07183a;max-width:820px">
    <h2 style="margin:0 0 4px">Online orders — ${range}</h2>
    <p style="margin:0 0 18px;color:#667">${orders.length} total · ${counts.collected ?? 0} collected · ${counts.accepted ?? 0} accepted · ${counts.rejected ?? 0} rejected · ${counts.new ?? 0} never actioned · collected takings ${formatMoney(takings)}</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <thead><tr style="background:#e9f0f9;text-align:left"><th style="padding:8px">Time</th><th style="padding:8px">Customer</th><th style="padding:8px">Order</th><th style="padding:8px">Pickup</th><th style="padding:8px">Total</th><th style="padding:8px">Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:22px;color:#889;font-size:12px">These orders stay in the system as your sales record — this email is a summary, not the only copy.</p>
  </div>`;
}

export async function GET(request: NextRequest) {
  if (!authorised(request)) return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.DIGEST_EMAIL_TO;
  const from = process.env.DIGEST_EMAIL_FROM;
  if (!apiKey || !to || !from) {
    return NextResponse.json({ error: "Email not configured — set RESEND_API_KEY, DIGEST_EMAIL_TO, DIGEST_EMAIL_FROM." }, { status: 503 });
  }

  let orders: Order[];
  try {
    orders = await select<Order>("orders", "archived_at=is.null&order=created_at.asc");
  } catch (err) {
    console.error("[digest] load failed:", err);
    return NextResponse.json({ error: "Could not load orders." }, { status: 502 });
  }
  if (orders.length === 0) return NextResponse.json({ ok: true, sent: false, reason: "No new orders." });

  // Send before archiving: if the email fails, next week's run picks them up.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to.split(",").map((a) => a.trim()),
      subject: `${site.shortName} — ${orders.length} online order${orders.length === 1 ? "" : "s"} this week`,
      html: buildHtml(orders),
    }),
  });
  if (!res.ok) {
    console.error("[digest] email failed:", await res.text());
    return NextResponse.json({ error: "Email failed — orders left for the next run." }, { status: 502 });
  }

  try {
    await update("orders", `id=in.(${orders.map((o) => o.id).join(",")})`, { archived_at: new Date().toISOString() });
  } catch (err) {
    console.error("[digest] archive failed (email was sent):", err);
  }
  return NextResponse.json({ ok: true, sent: true, count: orders.length });
}
