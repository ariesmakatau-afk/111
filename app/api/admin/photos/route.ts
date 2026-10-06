import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/requireStaff";
import { isConfigured, uploadToStorage } from "@/lib/supabase";
import { PHOTO_LIMITS, readPhotos, writePhotos, type PhotoKind, type WallPhoto } from "@/lib/content-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Staff photos ("team") and the customer wall ("customers"). Same rules for
// both: JPG/PNG/WEBP up to 8MB, newest first, a cap on how many are shown.

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

// The home page and /parea are cached; refresh them now so a change shows on
// the next visit instead of a visit or two later.
function refreshPublicPages() {
  revalidatePath("/");
  revalidatePath("/parea");
}

function kindOf(v: unknown): PhotoKind | null {
  return v === "team" || v === "customers" ? v : null;
}

export async function GET(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin only." }, { status: 401 });
  const kind = kindOf(new URL(request.url).searchParams.get("kind"));
  if (!kind) return NextResponse.json({ error: "Which photos?" }, { status: 400 });
  return NextResponse.json({ photos: await readPhotos(kind) });
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin only." }, { status: 401 });
  if (!isConfigured()) return NextResponse.json({ error: "Storage isn't set up yet." }, { status: 503 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const kind = kindOf(form.get("kind"));
  const file = form.get("photo");
  const caption = String(form.get("caption") ?? "").trim().slice(0, 140);
  const name = String(form.get("name") ?? "").trim().slice(0, 40);

  if (!kind) return NextResponse.json({ error: "Which photos?" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo was attached." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG or WEBP image." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That image is over 8MB." }, { status: 400 });
  const line = caption || (kind === "team" ? name || "The team" : name || "At Yianni's");

  const photos = await readPhotos(kind);
  if (photos.length >= PHOTO_LIMITS[kind]) {
    return NextResponse.json({ error: `That wall holds ${PHOTO_LIMITS[kind]} photos — remove one first.` }, { status: 400 });
  }

  try {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const folder = kind === "team" ? "team" : "parea/wall";
    const url = await uploadToStorage("media", `${folder}/${id}.${ext}`, await file.arrayBuffer(), file.type);
    const next: WallPhoto[] = [{ id, url, caption: line, ...(name ? { name } : {}) }, ...photos];
    await writePhotos(kind, next);
    refreshPublicPages();
    return NextResponse.json({ photos: next });
  } catch (err) {
    console.error("[admin/photos] upload failed:", err);
    const detail = err instanceof Error ? err.message.slice(0, 200) : "";
    return NextResponse.json({ error: `Upload failed. ${detail}`.trim() }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Admin only." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const kind = kindOf(params.get("kind"));
  const id = params.get("id");
  if (!kind || !id) return NextResponse.json({ error: "Which photo?" }, { status: 400 });
  try {
    const next = (await readPhotos(kind)).filter((p) => p.id !== id);
    await writePhotos(kind, next);
    refreshPublicPages();
    return NextResponse.json({ photos: next });
  } catch (err) {
    console.error("[admin/photos] delete failed:", err);
    return NextResponse.json({ error: "Could not remove it." }, { status: 502 });
  }
}
