import { NextResponse } from "next/server";
import { readDeal } from "@/lib/content-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public: the current deal, read fresh every time, so switching it off or
 * changing it in /admin shows on the very next page load.
 */
export async function GET() {
  const deal = await readDeal();
  if (!deal.on || !deal.banner) return NextResponse.json({ on: false });
  return NextResponse.json({ on: true, banner: deal.banner, details: deal.details });
}
