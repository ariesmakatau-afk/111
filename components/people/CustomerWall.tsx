import type { WallPhoto } from "@/lib/content-store";

const tilt = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0", "-rotate-1"];

// Uploaded photos only, centred: 1 photo sits in the middle, 4 fill the row.
// No fixed columns, so a short wall never leaves empty space beside it.
const cell = (compact: boolean) => `w-[calc(50%-0.625rem)] ${compact ? "" : "sm:w-[calc(33.333%-0.84rem)] lg:w-[calc(25%-0.94rem)]"}`;

/** Customer photos pinned up like prints on the shop wall. Uploads only. */
export default function CustomerWall({ photos, limit = 4, compact = false }: { photos: WallPhoto[]; limit?: number; compact?: boolean }) {
  const list = photos.filter((p) => p.url).slice(0, limit);
  if (list.length === 0) return null;
  return (
    <ul className={`flex flex-wrap justify-center gap-x-5 gap-y-8 ${compact ? "" : "lg:flex-nowrap"}`}>
      {list.map((p, i) => (
        <li key={p.id} className={`${cell(compact)} ${tilt[i % tilt.length]} transition duration-500 hover:rotate-0 hover:scale-[1.03]`} data-reveal="fade">
          <figure className="relative bg-white p-2.5 pb-4 shadow-[0_18px_40px_-18px_rgba(11,20,40,.55)]">
            <span aria-hidden="true" className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full shadow-[0_2px_4px_rgba(0,0,0,.35)]" style={{ background: "var(--fire-btn)" }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption} className="aspect-square w-full object-cover" loading="lazy" />
            <figcaption className="mt-3 px-1 font-serif text-[1.15rem] leading-snug text-blue-navy">
              {p.caption}
              {p.name && <span className="mt-1 block font-sans text-xs font-bold text-muted">— {p.name}</span>}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
