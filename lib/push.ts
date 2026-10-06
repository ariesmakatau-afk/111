// lib/push.ts
//
// Web Push, server side. Sends a notification to every device a customer (or
// the kitchen) opted in from, for one order. Subscriptions live in the same
// optional Supabase database everything else uses, in a `push_subscriptions`
// table; VAPID keys come from the environment and are NEVER committed.
//
//   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT
//
// If the keys or the database are absent, everything here degrades to a quiet
// no-op — the site keeps working, it just can't wake a closed tab. That's by
// design: notifications are a bonus layer, never a dependency of ordering.

import webpush from "web-push";
import { isConfigured, remove, select, upsert } from "./supabase";

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:yiannisyiros2020@gmail.com";

let configured = false;
if (PUBLIC_KEY && PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  } catch (err) {
    console.error("[push] VAPID keys rejected:", err);
  }
}

/** True when the server can sign push payloads (keys present and valid). */
export function pushReady(): boolean {
  return configured && isConfigured();
}

/** The public key clients need to subscribe. Null when push is off. */
export function pushPublicKey(): string | null {
  return configured ? PUBLIC_KEY! : null;
}

export type PushPayload = {
  title: string;
  body: string;
  /** Relative URL to open on tap, e.g. /order/status/<id>. */
  url?: string;
  tag?: string;
  /** Kitchen-only pings don't carry customer PII. */
  urgent?: boolean;
};

const TABLE = "push_subscriptions";
const MAX_DEVICE = 50;

// orderRef is either a customer's order UUID (PII-scoped to that order) or the
// reserved "kitchen" bucket (staff devices). The regex is the whole security
// story: a device subscribed to order A is only ever sent data about order A,
// and there is no endpoint to list refs — you must already hold the UUID.
const ORDER_REF_RE = /^([0-9a-f-]{36}|kitchen)$/i;

type Row = { endpoint: string; p256dh: string; auth: string };

/** Store a device's subscription for an order (idempotent per order + device). */
export async function subscribe(
  orderRef: string,
  endpoint: string,
  keys: { p256dh: string; auth: string }
): Promise<boolean> {
  if (!configured || !isConfigured() || !ORDER_REF_RE.test(orderRef)) return false;
  if (!endpoint || !keys?.p256dh || !keys?.auth) return false;
  try {
    await upsert(
      TABLE,
      { order_ref: orderRef, endpoint, p256dh: keys.p256dh, auth: keys.auth, updated_at: new Date().toISOString() },
      "order_ref,endpoint"
    );
    return true;
  } catch (err) {
    console.error("[push] subscribe failed:", err);
    return false;
  }
}

export async function unsubscribe(orderRef: string, endpoint: string): Promise<void> {
  if (!isConfigured() || !endpoint) return;
  try {
    await remove(TABLE, `order_ref=eq.${encodeURIComponent(orderRef)}&endpoint=eq.${encodeURIComponent(endpoint)}`);
  } catch (err) {
    console.error("[push] unsubscribe failed:", err);
  }
}

async function subscribers(orderRef: string): Promise<Row[]> {
  const rows = await select<Row>(
    TABLE,
    `order_ref=eq.${encodeURIComponent(orderRef)}&select=endpoint,p256dh,auth&limit=${MAX_DEVICE}`
  );
  return rows;
}

/** Send to every device following one order. Never throws; returns counts. */
export async function pushToOrder(
  orderRef: string,
  payload: PushPayload
): Promise<{ sent: number; pruned: number }> {
  if (!pushReady() || !ORDER_REF_RE.test(orderRef)) return { sent: 0, pruned: 0 };
  let rows: Row[];
  try {
    rows = await subscribers(orderRef);
  } catch {
    // Table not created yet — a silent, expected state on a fresh DB.
    return { sent: 0, pruned: 0 };
  }
  const body = JSON.stringify(payload);
  let sent = 0;
  let pruned = 0;
  await Promise.all(
    rows.map(async (r) => {
      try {
        await webpush.sendNotification(
          { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } },
          body,
          { TTL: 3600 }
        );
        sent++;
      } catch (err) {
        // 404/410 = gone/unsubscribed at the push service: prune it.
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) {
          await unsubscribe(orderRef, r.endpoint).catch(() => {});
          pruned++;
        } else {
          console.error(`[push] send to ${orderRef} failed (${code ?? "no status"}):`, err);
        }
      }
    })
  );
  return { sent, pruned };
}
