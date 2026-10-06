// lib/content-store.ts
//
// The things staff change from /admin without a redeploy: the two photo
// walls and the online-ordering switch. Each lives as one value in the
// `site_content` table. SERVER-SIDE ONLY (reads through lib/supabase).

import { getContent, isConfigured, setContent } from "./supabase";

export type PhotoKind = "team" | "customers";

export type WallPhoto = {
  id: string;
  url: string;
  /** Staff: their role ("On the spit since 2009"). Customers: the caption. */
  caption: string;
  name?: string;
};

export const PHOTO_KEYS: Record<PhotoKind, string> = {
  team: "team_photos",
  customers: "parea_photos",
};

export const PHOTO_LIMITS: Record<PhotoKind, number> = { team: 4, customers: 4 };

type ReadOpts = { revalidate?: number };

/** Public pages pass { revalidate: 30 }; admin and API routes read fresh. */
export async function readPhotos(kind: PhotoKind, opts: ReadOpts = {}): Promise<WallPhoto[]> {
  const raw = await getContent(PHOTO_KEYS[kind], opts);
  if (!raw) {
    // The previous site kept a single team photo; carry it over if present.
    if (kind === "team") {
      const legacy = await getContent("team_photo_url", opts);
      if (legacy) return [{ id: "legacy-team", url: legacy, caption: "The team" }];
    }
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is WallPhoto =>
        Boolean(p) && typeof p.id === "string" && typeof p.url === "string" && typeof p.caption === "string"
    );
  } catch {
    return [];
  }
}

export async function writePhotos(kind: PhotoKind, photos: WallPhoto[]): Promise<void> {
  await setContent(PHOTO_KEYS[kind], JSON.stringify(photos));
}

export type OrderingSettings = { paused: boolean; message: string };

const DEFAULT_PAUSE_MESSAGE = "Online orders are paused for a little while — give us a call instead.";

export async function readOrderingSettings(opts: ReadOpts = {}): Promise<OrderingSettings> {
  const raw = await getContent("ordering", opts);
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      paused: Boolean(parsed.paused),
      message: typeof parsed.message === "string" && parsed.message.trim() ? parsed.message : DEFAULT_PAUSE_MESSAGE,
    };
  } catch {
    return { paused: false, message: DEFAULT_PAUSE_MESSAGE };
  }
}

export async function writeOrderingSettings(s: OrderingSettings): Promise<void> {
  await setContent("ordering", JSON.stringify(s));
}

/**
 * Shop-wide flags the kitchen can flip mid-service:
 *  - busyMinutes: a pacing buffer added to every wait time the customer is
 *    shown, while the board is slammed. Cleared when the rush passes.
 *  - soldOutNote: a plain sentence broadcast to the menu/checkout ("Pork is
 *    gone tonight") so nobody orders something that isn't there.
 * Lives in the same site_content table as the ordering pause — no schema.
 */
export type ShopFlags = { busyMinutes: number; soldOutNote: string | null };

const DEFAULT_FLAGS: ShopFlags = { busyMinutes: 0, soldOutNote: null };

export async function readShopFlags(opts: ReadOpts = {}): Promise<ShopFlags> {
  const raw = await getContent("shop_flags", opts);
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    const mins = Number(parsed.busyMinutes);
    const note = typeof parsed.soldOutNote === "string" && parsed.soldOutNote.trim() ? parsed.soldOutNote.trim().slice(0, 140) : null;
    return {
      busyMinutes: Number.isFinite(mins) ? Math.max(0, Math.min(120, Math.round(mins))) : 0,
      soldOutNote: note,
    };
  } catch {
    return DEFAULT_FLAGS;
  }
}

export async function writeShopFlags(f: ShopFlags): Promise<void> {
  await setContent("shop_flags", JSON.stringify(f));
}

export { isConfigured };

/**
 * The current deal, set from /admin. `banner` is the one line shown at the
 * top of the home page; `details` is the full deal, shown on /menu.
 */
export type Deal = { on: boolean; banner: string; details: string };

export async function readDeal(opts: ReadOpts = {}): Promise<Deal> {
  const raw = await getContent("deal", opts);
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      on: Boolean(parsed.on),
      banner: typeof parsed.banner === "string" ? parsed.banner : "",
      details: typeof parsed.details === "string" ? parsed.details : "",
    };
  } catch {
    return { on: false, banner: "", details: "" };
  }
}

export async function writeDeal(d: Deal): Promise<void> {
  await setContent("deal", JSON.stringify(d));
}
