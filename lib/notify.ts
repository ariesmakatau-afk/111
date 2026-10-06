// lib/notify.ts
//
// The single seam between the site and the shop's phone. Orders and
// catering enquiries only ever call these functions; switching from
// Telegram to SMS later means editing this file alone.
//
// With no channel configured (local development), messages are written to
// the server log so every flow can still be tested end to end.

import { formatMoney } from "./menu";
import type { OrderItem } from "./order";

export type PickupOrder = {
  customerName: string;
  phone: string;
  pickupTime: string;
  items: OrderItem[];
  total: number;
  orderNotes?: string;
  email?: string;
  statusUrl?: string;
};

export type CateringEnquiry = {
  name: string;
  phone: string;
  email?: string;
  eventDate: string;
  headcount: number;
  fulfilment: string;
  notes?: string;
};

function orderText(o: PickupOrder): string {
  const lines = [
    "🔥 New pickup order — Yianni's, Hindley St",
    `Name: ${o.customerName}`,
    `Phone: ${o.phone}`,
    `Pickup: ${o.pickupTime}`,
    ...(o.email ? [`Email: ${o.email}`] : []),
    "",
    ...o.items.map(
      (i) => `• ${i.quantity}× ${i.name}${i.detail ? ` — ${i.detail}` : ""}  (${formatMoney(i.unitPrice * i.quantity)})`
    ),
    "",
    `Total: ${formatMoney(o.total)} — pay in store`,
  ];
  if (o.orderNotes) lines.push(`Notes: ${o.orderNotes}`);
  if (o.statusUrl) lines.push("", "Accept it and set a wait time on the kitchen board (/kitchen).");
  return lines.join("\n");
}

function cateringText(e: CateringEnquiry): string {
  return [
    "🍽 New catering enquiry — Yianni's",
    `Name: ${e.name}`,
    `Phone: ${e.phone}`,
    ...(e.email ? [`Email: ${e.email}`] : []),
    `Date: ${e.eventDate}`,
    `People: ${e.headcount}`,
    `Pickup/delivery: ${e.fulfilment}`,
    ...(e.notes ? ["", `Notes: ${e.notes}`] : []),
  ].join("\n");
}

async function send(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    // eslint-disable-next-line no-console
    console.log("[notify] No channel configured — logging instead:\n" + text);
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) throw new Error(`Telegram notify failed: ${res.status} ${await res.text()}`);
}

export const notifyOrder = (o: PickupOrder) => send(orderText(o));
export const notifyCatering = (e: CateringEnquiry) => send(cateringText(e));

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
