import type { Metadata } from "next";
import { requireStaffPage } from "@/lib/requireStaff";
import { isConfigured, select } from "@/lib/supabase";
import { MAX_SESSIONS } from "@/lib/session";
import { pushReady } from "@/lib/push";
import { readDeal, readOrderingSettings, readPhotos } from "@/lib/content-store";
import AdminPanel, { type Enquiry, type TodayStats } from "@/components/staff/AdminPanel";

export const metadata: Metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

const adelaideDay = (d: Date) => d.toLocaleDateString("en-AU", { timeZone: "Australia/Adelaide" });

export default async function AdminPage() {
  await requireStaffPage("/admin", "admin");
  const db = isConfigured();

  const [team, customers, ordering, deal] = await Promise.all([
    readPhotos("team"),
    readPhotos("customers"),
    readOrderingSettings(),
    readDeal(),
  ]);

  let enquiries: Enquiry[] = [];
  let stats: TodayStats | null = null;
  if (db) {
    const since = new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString();
    const [enq, orders] = await Promise.all([
      select<Enquiry>("enquiries", "order=created_at.desc&limit=50").catch(() => []),
      select<{ created_at: string; status: string; total: number | null }>(
        "orders",
        `created_at=gte.${since}&select=created_at,status,total`
      ).catch(() => select<{ created_at: string; status: string; total: number | null }>("orders", `created_at=gte.${since}&select=created_at,status`).catch(() => [])),
    ]);
    enquiries = enq;
    const today = adelaideDay(new Date());
    const t = orders.filter((o) => adelaideDay(new Date(o.created_at)) === today);
    const live = t.filter((o) => o.status !== "rejected");
    stats = {
      orders: t.length,
      waiting: t.filter((o) => o.status === "new").length,
      cooking: t.filter((o) => o.status === "accepted").length,
      collected: t.filter((o) => o.status === "collected").length,
      rejected: t.filter((o) => o.status === "rejected").length,
      value: live.reduce((s, o) => s + Number(o.total ?? 0), 0),
    };
  }

  // Push needs the VAPID keys AND the push_subscriptions table from the schema.
  const pushTable = pushReady() && (await select("push_subscriptions", "select=id&limit=1").then(() => true, () => false));

  const setup = {
    database: db,
    staffLogin: db && Boolean(process.env.STAFF_PASSWORD && process.env.STAFF_SESSION_SECRET),
    // Never locked out, so it has to be long enough not to be guessed.
    adminLogin: db && Boolean(process.env.STAFF_SESSION_SECRET) && (process.env.ADMIN_PASSWORD?.length ?? 0) >= 12,
    phoneAlerts: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    weeklyEmail: Boolean(process.env.RESEND_API_KEY && process.env.DIGEST_EMAIL_TO && process.env.DIGEST_EMAIL_FROM && process.env.CRON_SECRET),
    lockScreenPush: pushTable,
  };

  return <AdminPanel team={team} customers={customers} ordering={ordering} deal={deal} enquiries={enquiries} stats={stats} setup={setup} maxSessions={MAX_SESSIONS} />;
}
